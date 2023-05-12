const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const colors = require("colors");
const ObjectId = require("mongodb").ObjectId;
const { MongoClient, ServerApiVersion, GridFSBucket } = require("mongodb");
const app = require("./app");

 


// const bucket = new GridFSBucket(db, { bucketName: 'images' });
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
// database connection
mongoose.connect(process.env.DATABASE).then(() => {
  console.log(`Database connection is successful`.red.italic.bold);
});

const uri = process.env.DATABASE;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// server
const port = process.env.PORT || 8080;

async function run() {
  try {
    await client.connect();
    const depositCollection = client.db("mobile-bank").collection("deposit");
    const depositStatusCollection = client
      .db("mobile-bank")
      .collection("deposit-status");
    const newRequestCollection = client
      .db("mobile-bank")
      .collection("new-request");
    const requestApproveCollection = client
      .db("mobile-bank")
      .collection("approve-request");
    const requestDeleteCollection = client
      .db("mobile-bank")
      .collection("delete-request");
    const usersCollection = client.db("test").collection("users");
    const depositHistoryCollection = client
      .db("mobile-bank")
      .collection("deposit-history");
    const withdrawHistoryCollection = client
      .db("mobile-bank")
      .collection("withdraw-history");
    const noticeCollection = client.db("mobile-bank").collection("notice");
    //deposit
    app.post("/api/v1/deposit", async (req, res) => {
      const info = req.body;
      info["milliseconds"] = Date.now();
      if (info.name === "Admin") {
        const result = await depositCollection.insertOne(info);
        res.send(result);
      } else {
        info["image"] = info.image.split("/")[3];
        const resultStatus = await depositStatusCollection.insertOne(info);
        const result = await depositCollection.insertOne(info);
        res.send(result);
      }
    });

    //post new request
    app.post("/api/v1/newRequest", async (req, res) => {
      const info = req.body;
      info["approve"] = false;
      const trxObject = await usersCollection.findOne({
        username: info.customer,
      });
      info["trx"] = trxObject.trx;
      const status = { isSuccess: false };
      if (trxObject.balance > parseFloat(info.amount) + info.commission) {
        const result = await newRequestCollection.insertOne(info);
        status.isSuccess = true;
      } else {
        status.isSuccess = false;
      }
      res.send(status);
    });

    //post notice board
    app.post("/api/v1/notice", async (req, res) => {
      const info = req.body;
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          header: info.header,
          body: info.body,
          footer: info.footer,
        },
      };
      const result = await noticeCollection.updateMany({}, updateDoc, options);
      res.send(result);
    });

    //post depositByAdmin
    app.put("/api/v1/depositByAdmin", async (req, res) => {
      const info = req.body;
      const filter = { _id: new ObjectId(info.id) };
      const userInfo = await usersCollection.findOne(filter);
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          balance: userInfo.balance
            ? userInfo.balance + parseFloat(info.amount)
            : 0 + parseFloat(info.amount),
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );


      await depositHistoryCollection.insertOne(info);
      const updateDocDeposit = {
        $set: {
          totalDeposit: userInfo.totalDeposit
            ? userInfo.totalDeposit + parseFloat(info.amount)
            : 0 + parseFloat(info.amount),
        },
      };
      await usersCollection.updateOne(
        filter,
        updateDocDeposit,
        options
      );
      res.send(result);
    });

    //post withdrawByAdmin
    app.post("/api/v1/withdrawByAdmin", async (req, res) => {
      const info = req.body;
      const filter = { _id: new ObjectId(info.id) };
      const userInfo = await usersCollection.findOne(filter);
      const status = { isSuccess: false };
      if (userInfo.balance >= parseFloat(info.amount)) {
        const updateDoc = {
          $set: {
            balance: userInfo.balance - parseFloat(info.amount),
          },
        };
        const result = await usersCollection.updateOne(filter, updateDoc);
        const insert = await withdrawHistoryCollection.insertOne(info);
        status.isSuccess = true;
      } else {
        status.isSuccess = false;
      }
      res.send(status);
    });

    //approve new request
    app.post("/api/v1/requestApprove/:id", async (req, res) => {
      const id = req.params.id;
      const information = req.body;
      const result = await requestApproveCollection.insertOne(information);

      const update = await newRequestCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: { approve: true },
        }
      );

      const userInfo = await usersCollection.findOne({
        username: information.customer,
      });

      const updateBalance = {
        $set: {
          balance:
            userInfo.balance -
            parseFloat(information.amount) -
            information.commission,
        },
      };

      const decreaseAmount = await usersCollection.updateOne(
        { username: information.customer },
        updateBalance
      );

      const filter = { username: information.customer };
      const options = { upsert: true };
      const updateDocCommission = {
        $set: {
          totalCommission: userInfo.totalCommission
            ? userInfo.totalCommission + parseFloat(information.commission)
            : 0 + parseFloat(information.commission),
        },
      };
      const updateCommission = await usersCollection.updateOne(
        filter,
        updateDocCommission,
        options
      );
      const updateDocWithdraw = {
        $set: {
          totalWithdraw: userInfo.totalWithdraw
            ? userInfo.totalWithdraw + parseFloat(information.amount)
            : 0 + parseFloat(information.amount),
        },
      };
      const updateWithdraw = await usersCollection.updateOne(
        filter,
        updateDocWithdraw,
        options
      );

      res.send(result);
    });

    //delete new request
    app.delete("/api/v1/requestDelete/:id", async (req, res) => {
      const information = req.body;
      const result = await requestDeleteCollection.insertOne(information);
      res.send(result);
    });

    //get all deposit user for admin
    app.get("/api/v1/depositUser", async (req, res) => {
      const allDepositInfo = await depositCollection
        .find({
          name: { $ne: "Admin" },
        })
        .toArray();
      const allDepositStatus = await depositStatusCollection.find({}).toArray();
      const result = [];
      allDepositInfo.forEach((depositInfo) => {
        let total = 0;
        let obj = {
          name: "",
          subject: "",
          total: 0,
        };
        let find = false;
        result.forEach((value) => {
          if (value.name === depositInfo.name) {
            find = true;
          }
        });
        if (!find) {
          allDepositStatus.forEach((statusInfo) => {
            if (statusInfo.name === depositInfo.name) {
              total++;
            }
          });
          obj.name = depositInfo.name;
          obj.subject = depositInfo.subject;
          obj.total = total;
          result.push(obj);
        }
      });
      res.send(result);
    });

    //get all deposit
    app.get("/api/v1/deposit", async (req, res) => {
      const result = await depositCollection.find({}).toArray();
      res.send(result);
    });

    //get image
    app.get("/images/:filename", function (req, res) {
      var filename = req.params.filename;
      res.sendFile(__dirname + "/image/" + filename);
    });

    //get all pending order for admin
    app.get("/api/v1/pendingOrder", async (req, res) => {
      const result = await newRequestCollection
        .find({ approve: false })
        .toArray();
      res.send(result);
    });

    //get all pending orders for user
    app.get("/api/v1/pendingOrder/:name", async (req, res) => {
      const name = req.params.name;
      const result = await newRequestCollection
        .find({ approve: false, customer: name })
        .toArray();
      res.send(result);
    });

    //get recent reply
    app.get("/api/v1/depositRecent/:name", async (req, res) => {
      const name = req.params.name;
      const allReply = await depositCollection.find({ to: name }).toArray();
      const result = allReply[allReply.length - 1];
      res.send(result);
    });

    //get all single user's approve request
    app.get("/api/v1/approveByAdmin/:name", async (req, res) => {
      const name = req.params.name;
      const allApprove = await requestApproveCollection.find({}).toArray();
      const allNewRequest = await newRequestCollection.find({}).toArray();
      const result = [];
      allNewRequest.forEach((request) => {
        allApprove.forEach((approve) => {
          if (approve.previousId == request._id && request.customer === name) {
            result.push(request);
          }
        });
      });
      res.send(result);
    });

    //get orderHistory for a user
    app.get("/api/v1/orderHistory/:name", async (req, res) => {
      const name = req.params.name;
      const result = await newRequestCollection
        .find({ customer: name, approve: true })
        .toArray();
      res.send(result);
    });

    //get single customer pending orders
    app.get("/api/v1/newRequest/:name", async (req, res) => {
      const name = req.params.name;
      const result = await newRequestCollection
        .find({ customer: name })
        .toArray();
      res.send(result);
    });

    //get all customer pending orders
    app.get("/api/v1/newRequest", async (req, res) => {
      const allRequest = await newRequestCollection.find({}).toArray();
      res.send(allRequest)
      // const allDelete = await requestDeleteCollection.find({}).toArray();
      // const resultDemo = [];
      // allRequest.forEach((request) => {
      //   allDelete.forEach((deleteInfo) => {
      //       const find = resultDemo.find(
      //         (info) => info._id == deleteInfo.previousId
      //       );
      //       if (!find) {
      //         resultDemo.push(request);
      //       }
      //     }
      //   });
      // });

      // let index = 0;
      // resultDemo.sort((a, b) => {
      //   if (a._id == b._id) {
      //     index++;
      //     return 0;
      //   } else {
      //     return -1;
      //   }
      // });
      // resultDemo.length = resultDemo.length - index;
      // const result = [];
      // resultDemo.forEach((resultInfo) => {
      //   const find = allDelete.find(
      //     (info) => resultInfo._id == info.previousId
      //   );
      //   if (!find) {
      //     result.push(resultInfo);
      //   }
      // });
      // result.sort((a, b) => {
      //   if (a.approve && !b.approve) {
      //     return 1;
      //   } else {
      //     return -1;
      //   }
      // });
      // res.send(allRequest);
    });

    //get all customer pending orders
    app.get("/api/v1/users", async (req, res) => {
      const result = await usersCollection.find({}).toArray();
      res.send(result);
    });

    //get notice
    app.get("/api/v1/notice", async (req, res) => {
      const result = await noticeCollection.find({}).toArray();
      res.send(result);
    });

    //get all customers length,total deposit,total withdraw and total commission
    app.get("/api/v1/fourInfoForAdmin", async (req, res) => {
      const result = [
        {
          users: 0,
        },
        {
          withdraw: 0,
        },
        {
          deposit: 0,
        },
        {
          commission: 0,
        },
      ];
      const allUsers = await usersCollection.find({}).toArray();
      result[0].users = allUsers.length;
      allUsers.forEach((info) => {
        result[3].commission = info.totalCommission
          ? result[3].commission + info.totalCommission
          : 0 + result[3].commission;
        result[1].withdraw = info.totalWithdraw
          ? result[1].withdraw + info.totalWithdraw
          : 0 + result[1].withdraw;
        result[2].deposit = info.totalDeposit
          ? result[2].deposit + info.totalDeposit
          : 0 + result[2].deposit;
      });

      res.send(result);
    });

    //get single deposit user
    app.get("/api/v1/deposit/:name", async (req, res) => {
      const name = req.params.name;
      const result = await depositCollection
        .find({
          $or: [{ name: name }, { to: name }],
        })
        .toArray();

      const deleteInfo = await depositStatusCollection.deleteMany({
        name: name,
      });
      res.send(result);
    });

    //get single user info
    app.get("/api/v1/singleUser/:name", async (req, res) => {
      const name = req.params.name;
      // const result = await .find({});
      res.send(result);
    });

    //get search all user id
    app.get("/api/v1/getSearchId/:value", async (req, res) => {
      const value = req.params.value;
      const filter = { _id: new ObjectId(value) }
      const user = await usersCollection.findOne(filter)
      res.send(user);
      return
      const allUsers = await usersCollection.find({}).toArray();
      const result = [];

      allUsers.forEach((info) => {
        if (info._id.toString().startsWith(value)) {
          result.push({ id: info._id });
        }
      });
      if (result.length === 0) {
        result.push({ id: "No result found!" });
      }

      result.length = 3;

      res.send(result);
    });

    //get all pending orders for a user
    app.get("/api/v1/orderHistoryAll/:name", async (req, res) => {
      const name = req.params.name;
      const allApprove = await requestApproveCollection.find({}).toArray();
      const allNewRequest = await newRequestCollection.find({}).toArray();
      const result = [];
      allNewRequest.forEach((request) => {
        allApprove.forEach((approve) => {
          if (approve.previousId == request._id && request.customer === name) {
            request["approve"] = true;
            result.push(request);
          }
        });
      });
      const pendingResult = await newRequestCollection
        .find({ approve: false, customer: name })
        .toArray();
      pendingResult.forEach((info) => {
        result.push(info);
      });
      res.send(result);
    });

    //get all payment history for admin
    app.get("/api/v1/paymentHistory", async (req, res) => {
      const allDeposit = await depositHistoryCollection.find({}).toArray();
      const allWithdraw = await withdrawHistoryCollection.find({}).toArray();
      const result = [];
      allDeposit.forEach((info) => {
        info["status"] = "Deposit";
        result.push(info);
      });
      allWithdraw.forEach((info) => {
        info["status"] = "Withdraw";
        result.push(info);
      });
      res.send(result);
    });

    //get role
    app.get("/api/v1/role/:name", async (req, res) => {
      const name = req.params.name;
      console.log(name)
      const result = await usersCollection.findOne({ username: name })
      res.send(result);
    });

    //get yearly transition history for chart
    app.get("/api/v1/chartTransition", async (req, res) => {
      const allDeposit = await depositHistoryCollection.find({}).toArray();
      const allRequest = await requestApproveCollection.find({}).toArray();
      const data = [];
      allDeposit.forEach((info) => {
        data.push(info);
      });
      allRequest.forEach((info) => {
        data.push(info);
      });

      const currentDate = Date.now();
      const currentDateArray = new Date(currentDate)
        .toLocaleString()
        .split(",")[0];
      const currentYear = parseInt(currentDateArray.split("/")[2]);

      const result = [
        { jan: 0 },
        { feb: 0 },
        { mar: 0 },
        { apr: 0 },
        { may: 0 },
        { jun: 0 },
        { jul: 0 },
        { aug: 0 },
        { sep: 0 },
        { oct: 0 },
        { nov: 0 },
        { dec: 0 },
      ];

      data.forEach((info) => {
        if (
          new Date(info.date).toLocaleString().split(",")[0].split("/")[2] ==
          currentYear
        ) {

          if (
            new Date(info.date).toLocaleString().split(",")[0].split("/")[0] ==
            1
          ) {
            result[0].jan = result[0].jan + parseFloat(info.amount);
          } else if (
            new Date(info.date).toLocaleString().split(",")[0].split("/")[0] ==
            2
          ) {
            result[1].feb = result[1].feb + parseFloat(info.amount);
          } else if (
            new Date(info.date).toLocaleString().split(",")[0].split("/")[0] ==
            3
          ) {
            result[2].mar = result[2].mar + parseFloat(info.amount);
          } else if (
            new Date(info.date).toLocaleString().split(",")[0].split("/")[0] ==
            4
          ) {
            result[3].apr = result[3].apr + parseFloat(info.amount);
          } else if (
            new Date(info.date).toLocaleString().split(",")[0].split("/")[0] ==
            5
          ) {
            result[4].may = result[4].may + parseFloat(info.amount);
          } else if (
            new Date(info.date).toLocaleString().split(",")[0].split("/")[0] ==
            6
          ) {
            result[5].jun = result[5].jun + parseFloat(info.amount);
          } else if (
            new Date(info.date).toLocaleString().split(",")[0].split("/")[0] ==
            7
          ) {
            result[6].jul = result[6].jul + parseFloat(info.amount);
          } else if (
            new Date(info.date).toLocaleString().split(",")[0].split("/")[0] ==
            8
          ) {
            result[7].aug = result[7].aug + parseFloat(info.amount);
          } else if (
            new Date(info.date).toLocaleString().split(",")[0].split("/")[0] ==
            9
          ) {
            result[8].sep = result[8].sep + parseFloat(info.amount);
          } else if (
            new Date(info.date).toLocaleString().split(",")[0].split("/")[0] ==
            10
          ) {
            result[9].oct = result[9].oct + parseFloat(info.amount);
          } else if (
            new Date(info.date).toLocaleString().split(",")[0].split("/")[0] ==
            11
          ) {
            result[10].nov = result[10].nov + parseFloat(info.amount);
          } else if (
            new Date(info.date).toLocaleString().split(",")[0].split("/")[0] ==
            12
          ) {
            result[11].dec = result[11].dec + parseFloat(info.amount);
          }
        }
      });

      res.send(result);
    });

    //get all searchNewRequest
    app.get("/api/v1/searchNewRequest/:value", async (req, res) => {
      const value = req.params.value;
      console.log(typeof value);
      const allRequest = await newRequestCollection.find({}).toArray();
      const allDelete = await requestDeleteCollection.find({}).toArray();
      const resultDemo = [];
      allRequest.forEach((request) => {
        allDelete.forEach((deleteInfo) => {
          if (deleteInfo.previousId !== request._id.toString()) {
            const find = resultDemo.find(
              (info) => info._id == deleteInfo.previousId
            );
            if (!find) {
              resultDemo.push(request);
            }
          }
        });
      });

      let index = 0;
      resultDemo.sort((a, b) => {
        if (a._id == b._id) {
          index++;
          return 0;
        } else {
          return -1;
        }
      });
      resultDemo.length = resultDemo.length - index;
      const result = [];
      resultDemo.forEach((resultInfo) => {
        const find = allDelete.find(
          (info) => resultInfo._id == info.previousId
        );
        if (!find) {
          result.push(resultInfo);
        }
      });
      result.sort((a, b) => {
        if (a.approve && !b.approve) {
          return 1;
        } else {
          return -1;
        }
      });
      console.log(result);
      const info = result.filter(
        (i) => i.amount === value || i.recipient === value
      );
      res.send(info);
    });

    //get today, weekly, monthly and yearly filter for user
    app.get("/api/v1/fourFilterForUser/:name", async (req, res) => {
      const name = req.params.name;
      const allDepositHistory = await depositHistoryCollection
        .find({})
        .toArray();
      const allDeposit = await depositCollection.find({}).toArray();
      const allApproveRequest = await requestApproveCollection
        .find({})
        .toArray();
      const userInfo = await usersCollection.findOne({ username: name });

      const userAllData = [];

      allDepositHistory.forEach((info) => {
        if (info.id == userInfo._id && userInfo.username === name) {
          userAllData.push(info);
        }
      });

      allApproveRequest.forEach((info) => {
        if (info.customer === name) {
          userAllData.push(info);
        }
      });

      const result = [
        {
          today: [],
        },
        {
          weekly: [],
        },
        {
          monthly: [],
        },
        {
          yearly: [],
        },
      ];
      const currentDate = Date.now();
      const currentDateArray = new Date(currentDate)
        .toLocaleString()
        .split(",")[0];

      const currentMonth = parseInt(currentDateArray.split("/")[0]);
      const currentDay = parseInt(currentDateArray.split("/")[1]);
      const currentYear = parseInt(currentDateArray.split("/")[2]);

      const previousDay = currentDay;
      let previousMonth;
      let previousYear;
      if (currentMonth > 1) {
        previousMonth = currentMonth - 1;
        previousYear = currentYear;
      } else if (currentMonth === 1) {
        previousMonth = 12;
        previousYear = currentYear - 1;
      }
      const previousDateArray = [previousMonth, previousDay, previousYear];
      const previousDateString = `${previousDateArray.join("/")}, 12:00:00 AM`;
      const previousDateMilliseconds = Date.parse(previousDateString);

      const currentDateFilterEndString = `${currentDateArray}, 11:59:59 PM`;
      const currentDateFilterEndMilliseconds = Date.parse(
        currentDateFilterEndString
      );

      const currentDateFilterStartString = `${currentDateArray}, 12:00:00 AM`;
      const currentDateFilterStartMilliseconds = Date.parse(
        currentDateFilterStartString
      );

      const previousYearFilter = currentYear - 1;
      const previousYearFilterArray = [
        currentMonth,
        currentDay,
        previousYearFilter,
      ];

      const previousYearStartString = `${previousYearFilterArray.join(
        "/"
      )}, 12:00:00 AM`;
      const previousYearStartMilliseconds = Date.parse(previousYearStartString);

      userAllData.forEach((info) => {
        if (
          info.date >= currentDateFilterStartMilliseconds &&
          info.date <= currentDateFilterEndMilliseconds
        ) {
          result[0].today.push(info);
          result[1].weekly.push(info);
          result[2].monthly.push(info);
          result[3].yearly.push(info);
        } else if (
          info.date >= currentDateFilterStartMilliseconds - 604800000 &&
          info.date <= currentDateFilterEndMilliseconds
        ) {
          result[1].weekly.push(info);
          result[2].monthly.push(info);
          result[3].yearly.push(info);
        } else if (
          info.date >= previousDateMilliseconds &&
          info.date <= currentDateFilterEndMilliseconds
        ) {
          result[2].monthly.push(info);
          result[3].yearly.push(info);
        } else if (
          info.date >= previousYearStartMilliseconds &&
          info.date <= currentDateFilterEndMilliseconds
        ) {
          result[3].yearly.push(info);
        }
      });
      res.send(result);
    });
  } finally {
    console.log("Code is successfully running.");
  }
}

run().catch((err) => {
  console.error(err);
});

app.listen(port, () => {
  console.log(`App is running on port ${port}`.yellow.italic.bold);
});

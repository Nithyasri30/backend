const express = require("express");
const { check, validationResult} = require("express-validator/check");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const auth=require("../middleware/auth");

const Admin = require("../Schemass/Adminschema");

router.post(
    "/signup",
    [
        check("mobile","Please enter your mobile number").not().isEmpty(),
        check("email","Please enter your mailid").isEmail(),
        check("password", "Please enter a valid password").isLength({
            min: 8
        })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }
        const {
            email,
            password,
            mobile,
            requests=[]
        } = req.body;

        try {
            let admin = await Admin.findOne({
                email
            });
            if (admin) {
                return res.status(400).json({
                    msg: "User Already Exists"
                });
            }

            admin = new Admin({
               email ,
                password ,
                mobile ,
                requests
            });

            console.log(req.body.requests[0]);
            const salt = await bcrypt.genSalt(10);
            admin.password = await bcrypt.hash(password, salt);

            await admin.save();

            const payload = {
                admin: {
                    id: admin.id
                }
            };

            jwt.sign(
                payload,
                "randomString", {
                    expiresIn: 10000
                },
                (err, token) => {
                    if (err) throw err;
                    res.status(200).json({
                        token
                    });
                }
            );
        } catch (err) {
            console.log(err.message);
            res.status(500).send("Error in Saving");
        }
    }
);

router.post(
    "/login",
    [
      check("email", "Please enter a valid email").isEmail(),
      check("password", "Please enter a valid password").isLength({
        min: 8
      })
    ],
    async (req, res) => {
      const errors = validationResult(req);
  
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array()
        });
      }
  
      const { email, password } = req.body;
      try {
        let admin = await Admin.findOne({
          email
        });
        if (!admin)
          return res.status(400).json({
            message: "User Not Exist"
          });
  
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch)
          return res.status(400).json({
            message: "Incorrect Password !"
          });
  
        const payload = {
          admin: {
            id: admin.id
          }
        };
  
        jwt.sign(
          payload,
          "randomString",
          {
            expiresIn: 3600
          },
          (err, token) => {
            if (err) throw err;
            res.status(200).json({
              token
            });
          }
        );
      } catch (e) {
        console.error(e);
        res.status(500).json({
          message: "Server Error"
        });
      }
    }
  );

  router.get("/me", auth, async (req, res) => {
    try {
      // request.user is getting fetched from Middleware after token authentication
      const admin = await Admin.findById(req.admin.id);
      res.json(admin);
    } catch (e) {
      res.send({ message: "Error in Fetching user" });
    }
  });
module.exports = router;
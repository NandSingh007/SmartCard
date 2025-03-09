const CompanyAdmin = require("../Modal/CompanyAdmin");
const CompanyPro = require("../Modal/CompanyPro");
const IdentityUser = require("../Modal/IdentityUser");
const InsuranceSch = require("../Modal/InsuranceSch");
const Registration = require("../Modal/Registration");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const JWT_SECRET = "data";
exports.Registration = async (req, res) => {
  try {
    const { name, number, network, password, city } = req.body;
    // Check for missing fields
    if (!name || !number || !network || !password || !city) {
      return res.status(400).json({
        message: "All fields are required."
      });
    }

    // Check if the number already exists
    const existingUser = await Registration.findOne({ number });
    if (existingUser) {
      return res.status(409).json({
        message: "This number is already registered."
      });
    }

    // Create a new registration document
    const data = new Registration({
      name,
      number,
      network,
      password,
      city
    });

    // Save to the database
    const response = await data.save();

    // Respond with success message
    return res.status(201).json({
      message: "Resource successfully created.",
      data: response
    });
  } catch (error) {
    // Handle errors
    console.error("Error in Registration:", error.message);
    return res.status(500).json({
      message: "An error occurred while creating the resource.",
      error: error.message
    });
  }
};
exports.Login = async (req, res) => {
  try {
    const { password, number } = req.body;
    // console.log(password, number);

    // Check if required fields are provided
    if (!password || !number) {
      return res.status(400).json({
        message: "All fields are required."
      });
    }

    // Find user by phone number
    const user = await Registration.findOne({ number });
    console.log(user, "user");

    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    // Check if password matches
    if (user.password !== password) {
      return res.status(401).json({
        message: "Invalid password."
      });
    }

    // Fetch additional user data from IdentityUser collection
    const identityUserData = await IdentityUser.findOne({ UserId: user._id }) // Match by user ID
      .select("IdentityStatus FirstPayStatus SecondPayStatus")
      .lean();

    // console.log(identityUserData, "identityUserData");
    const identityStatus = identityUserData?.IdentityStatus || 0;
    const firstPayStatus = identityUserData?.FirstPayStatus || 0;
    const secondPayStatus = identityUserData?.SecondPayStatus || 0;
    // if (!identityUserData) {
    //   return res.status(404).json({
    //     message: "User data not found in IdentityUser."
    //   });
    // }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        number: user.number
      },
      JWT_SECRET, // Secret key
      { expiresIn: "3d" } // Token expiration time
    );

    // Respond with token and additional data
    return res.status(200).json({
      message: "Login successful.",
      token,
      userData: {
        id: user._id,
        number: user.number,
        IdentityStatus: identityStatus,
        FirstPayStatus: firstPayStatus,
        SecondPayStatus: secondPayStatus
      }
    });
  } catch (error) {
    // Handle errors
    console.error("Error in Login:", error.message);
    return res.status(500).json({
      message: "An error occurred during login.",
      error: error.message
    });
  }
};

exports.Identity = async (req, res) => {
  try {
    const {
      FatherName,
      email,
      EmployType,
      userId,
      gender,
      AdharcardNumber,
      PancardNumber
    } = req.body;

    // Trim whitespace from input fields
    const trimmedData = {
      FatherName: FatherName?.trim(),
      email: email?.trim(),
      EmployType: EmployType?.trim(),
      userId: userId?.trim(),
      gender: gender?.trim(),
      AdharcardNumber: AdharcardNumber?.trim(),
      PancardNumber: PancardNumber?.trim()
    };

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(trimmedData.userId)) {
      return res.status(400).json({ message: "Invalid userId format." });
    }

    // Validate required fields
    if (Object.values(trimmedData).some((field) => !field)) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Validate file uploads
    const adharFrontPageImg = req.files?.adharFrontPageImg?.[0]?.path || "";
    const adharBackPageImg = req.files?.adharBackPageImg?.[0]?.path || "";
    const panCardPageImg = req.files?.panCardPageImg?.[0]?.path || "";

    if (!adharFrontPageImg || !adharBackPageImg || !panCardPageImg) {
      return res.status(400).json({ message: "All images are required." });
    }

    // Check if user exists in Registration collection
    const userExists = await Registration.findById(trimmedData.userId);
    if (!userExists) {
      return res
        .status(404)
        .json({ message: "User with the provided userId does not exist." });
    }

    // Check for duplicate AdharcardNumber, PancardNumber, or email
    const existingUser = await IdentityUser.findOne({
      $or: [
        { AdharcardNumber: trimmedData.AdharcardNumber },
        { PancardNumber: trimmedData.PancardNumber },
        { email: trimmedData.email }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        message:
          "User with the provided AdharcardNumber, PancardNumber, or email already exists."
      });
    }

    // Save new IdentityUser
    const newIdentityUser = new IdentityUser({
      ...trimmedData,
      UserId: trimmedData.userId,
      adharFrontPageImg,
      adharBackPageImg,
      panCardPageImg,
      IdentityStatus: 1
    });

    const savedUser = await newIdentityUser.save();

    return res.status(201).json({
      message: "Identity details saved successfully.",
      data: savedUser
    });
  } catch (error) {
    console.error("Error in Identity Controller:", error.message);
    return res.status(500).json({
      message: "An error occurred while saving identity details.",
      error: error.message
    });
  }
};

exports.identityUserData = async (req, res) => {
  // console.log("hi");
  try {
    // Find data from the Registration collection
    const registrationData = await Registration.find()
      .select("name password city network number")
      .lean();

    if (!registrationData) {
      return res
        .status(404)
        .json({ message: "User not found in Registration" });
    }

    // Find data from the IdentityUser collection
    const identityUserData = await IdentityUser.find()
      .select(
        "FatherName IdentityStatus email EmployType gender AdharcardNumber PancardNumber adharFrontPageImg adharBackPageImg panCardPageImg UserId FirstPayStatus SecondPayStatus"
      )
      .lean();

    if (!identityUserData) {
      return res
        .status(404)
        .json({ message: "User not found in IdentityUser" });
    }

    // Combine both collections' data into a single array
    const dataa = identityUserData.map((identity) => {
      // Match and merge the corresponding registration data
      const registration = registrationData.find(
        (reg) => reg._id.toString() === identity.UserId.toString()
      );
      return {
        ...identity,
        ...registration
      };
    });
    const userData = dataa.reverse();

    // console.log(userData, "userData");

    // Send the combined data as the response
    return res.status(200).json({ userData });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.profile = async (req, res) => {
  try {
    // Get all required fields from the request body
    const { email, contactNo, address, charges1, charges2, upiId } = req.body;
    // console.log(email, contactNo, address, charges1, charges2, upiId);

    // Validate required fields
    if (
      !email ||
      !contactNo ||
      !address ||
      !charges1 ||
      !charges2 ||
      !req.file
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Handle the uploaded QR code image
    const QRImg = req.file.path;

    // Replace the existing profile with new data (or create a new one if none exists)
    const updatedProfile = await CompanyPro.findOneAndUpdate(
      {}, // No condition, just update the first available document or insert a new one
      {
        $set: {
          email, // Make sure to set the email in the document
          contactNo,
          address,
          upiId,
          charges1,
          charges2,
          QRImg
        }
      },
      { new: true, upsert: true } // This will create or update the document
    );

    // Respond with success
    res.status(200).json({
      message: "Profile updated successfully.",
      profile: updatedProfile
    });
  } catch (error) {
    // Log and return server error
    console.error("Error in profile controller:", error);
    res.status(500).json({ message: "Server error, please try again." });
  }
};

exports.getProfile = async (req, res) => {
  try {
    // Fetch the company profile from the database
    const profile = await CompanyPro.findOne();
    profile.QRImg = profile.QRImg.replace(/\\/g, "/").split("uploads/")[1];
    // console.log(profile);
    // console.log(profile);
    // Check if a profile exists
    if (!profile) {
      return res.status(404).json({ message: "No profile found." });
    }
    console.log(profile, "profile");
    // Return the profile data
    res.status(200).json({
      message: "Profile fetched successfully.",
      profile
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error, please try again." });
  }
};

exports.Insurance = async (req, res) => {
  try {
    const { bankName, amount } = req.body;

    // Validate input
    if (!bankName || !amount) {
      return res
        .status(400)
        .json({ message: "Bank name and amount are required" });
    }

    // Insert new record
    const newInsurance = new InsuranceSch({
      bankName,
      amount
    });

    await newInsurance.save();

    return res.status(201).json({
      message: "Data inserted successfully",
      data: newInsurance
    });
  } catch (error) {
    console.error("Error inserting data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getAllInsuranceData = async (req, res) => {
  try {
    // Fetch all data from the Insurance collection
    const insuranceData = await InsuranceSch.find();

    if (insuranceData.length === 0) {
      return res.status(404).json({
        message: "No data found"
      });
    }

    return res.status(200).json({
      message: "Data fetched successfully",
      data: insuranceData
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.insurancedit = async (req, res) => {
  try {
    const { bankName, amount, editRowId } = req.body;

    // Validate input
    if (!editRowId || !bankName || !amount) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    // Find the record by ID and update it
    const updatedInsurance = await InsuranceSch.findByIdAndUpdate(
      editRowId,
      { bankName, amount },
      { new: true } // Return the updated document
    );

    if (!updatedInsurance) {
      return res.status(404).json({ message: "Insurance data not found" });
    }

    return res.status(200).json({
      message: "Insurance data updated successfully",
      data: updatedInsurance
    });
  } catch (error) {
    console.error("Error updating insurance data:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
exports.Secondstatus = async (req, res) => {
  try {
    // Extract userId, status, and selectedPlanText from the request body
    const { userId, status, selectedPlanText } = req.body;

    // Validate the status (it should be either 0 or 1)
    if (status !== 0 && status !== 1) {
      return res
        .status(400)
        .json({ message: "Invalid status value. It should be 0 or 1." });
    }

    // Extract the last numerical digit from the selectedPlanText (assuming the last part is the amount)
    const lastDigitMatch = selectedPlanText.match(/\d+(\.\d+)?$/); // Match the last number in selectedPlanText
    if (!lastDigitMatch) {
      return res
        .status(400)
        .json({ message: "No valid number found in selected plan text" });
    }

    const amountToAdd = parseFloat(lastDigitMatch[0]); // Convert matched string to a number
    // console.log(amountToAdd, "amountToAdd");
    // Find the user by userId (which is equal to _id in Registration collection)
    const registration = await Registration.findOne({ _id: userId });

    if (!registration) {
      return res
        .status(404)
        .json({ message: "User not found in Registration collection" });
    }

    // Get the current cardamount and add the extracted amount
    const updatedCardAmount = registration.cardamount + amountToAdd;

    // Update the cardamount and SecondPayStatus for the user
    const updatedUser = await IdentityUser.findOneAndUpdate(
      { UserId: userId }, // Find user by userId
      { SecondPayStatus: status }, // Update the SecondPayStatus
      { new: true } // Return the updated document
    );

    // If the user is not found in IdentityUser
    if (!updatedUser) {
      return res
        .status(404)
        .json({ message: "User not found in IdentityUser" });
    }

    // Update the Registration document with the new cardamount
    const updatedRegistration = await Registration.findOneAndUpdate(
      { _id: userId }, // Use _id for the Registration collection
      { cardamount: updatedCardAmount },
      { new: true }
    );

    if (!updatedRegistration) {
      return res
        .status(500)
        .json({ message: "Failed to update cardamount in Registration" });
    }

    // Return the updated user and registration data
    return res.status(200).json({
      message: "Status and cardamount updated successfully",
      updatedUser,
      updatedRegistration
    });
  } catch (error) {
    console.error("Error updating SecondPayStatus and cardamount:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
exports.Firststatus = async (req, res) => {
  try {
    // Extract userId and new status from request body
    const { userId, status } = req.body;

    // Validate the status (it should be either 0 or 1)
    if (status !== 0 && status !== 1) {
      return res
        .status(400)
        .json({ message: "Invalid status value. It should be 0 or 1." });
    }

    // Fetch the charge data
    const charge = await CompanyPro.find();
    if (!charge || charge.length === 0) {
      return res.status(404).json({ message: "Company charges not found." });
    }
    const chargedata = charge[0].charges1;

    // Find the user in Registration collection
    const registration = await Registration.findOne({ _id: userId });
    if (!registration) {
      return res
        .status(404)
        .json({ message: "User not found in Registration collection." });
    }

    // Update the user's cardamount
    const updatedCardAmount = registration.cardamount + chargedata;

    const updatedRegistration = await Registration.findOneAndUpdate(
      { _id: userId }, // Match user by _id
      { cardamount: updatedCardAmount }, // Update cardamount
      { new: true } // Return the updated document
    );

    if (!updatedRegistration) {
      return res
        .status(500)
        .json({ message: "Failed to update cardamount in Registration." });
    }

    // Update the user's FirstPayStatus in IdentityUser collection
    const updatedUser = await IdentityUser.findOneAndUpdate(
      { UserId: userId }, // Match user by UserId
      { FirstPayStatus: status }, // Update FirstPayStatus
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ message: "User not found in IdentityUser collection." });
    }

    // Return success response with updated data
    return res.status(200).json({
      message: "FirstPayStatus and cardamount updated successfully.",
      updatedUser,
      updatedRegistration
    });
  } catch (error) {
    console.error("Error updating FirstPayStatus:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

exports.getPaymentStatuses = async (req, res) => {
  try {
    // Extract userId from the request body
    const { id } = req.params;
    // console.log(id, "id");

    if (!id) {
      return res.status(400).json({ message: "UserId is required." });
    }

    // Find the user in IdentityUser collection by matching UserId
    const user = await IdentityUser.findOne({ UserId: id });

    // If the user is not found
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found in IdentityUser collection." });
    }

    // Extract the required statuses
    const { FirstPayStatus, SecondPayStatus } = user;

    // Return the statuses in the response
    return res.status(200).json({
      message: "Payment statuses fetched successfully.",
      data: { FirstPayStatus, SecondPayStatus }
    });
  } catch (error) {
    console.error("Error fetching payment statuses:", error);
    return res.status(500).json({ message: "Server error." });
  }
};
exports.getUserDeatilsData = async (req, res) => {
  try {
    const { id } = req.params;

    // Find data from the Registration collection
    const registrationData = await Registration.findById(id)
      .select("name cardamount city network number")
      .lean();

    if (!registrationData) {
      return res
        .status(404)
        .json({ message: "User not found in Registration" });
    }

    // Find data from the IdentityUser collection
    const identityUserData = await IdentityUser.findOne({ UserId: id })
      .select(
        "FatherName IdentityStatus email EmployType gender AdharcardNumber PancardNumber UserId FirstPayStatus SecondPayStatus"
      )
      .lean();

    if (!identityUserData) {
      return res
        .status(404)
        .json({ message: "User not found in IdentityUser" });
    }

    // Combine the data from both collections
    const userData = {
      ...identityUserData,
      ...registrationData
    };

    // Send the combined data as the response
    return res.status(200).json({ userData });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.updatecardlimit = async (req, res) => {
  try {
    const { userId, cardamount } = req.body;
    // console.log(userId, cardamount);

    if (!userId || !cardamount) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    // Update the user data in the database (replace with your actual DB logic)
    const updatedUser = await Registration.updateOne(
      { _id: userId }, // Find user by UserId
      { $set: { cardamount: parseFloat(cardamount) } } // Update cardamount
    );

    if (updatedUser.modifiedCount > 0) {
      res.status(200).json({ message: "Card amount updated successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error updating card amount:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.loginBackend = async (req, res) => {
  try {
    const { username, password } = req.body;
    // console.log(username, password);

    // Validate input
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    // Check if companyAdmin exists
    let companyAdmin = await CompanyAdmin.findOne({});

    // If no company admin exists, create a new one
    if (!companyAdmin) {
      // const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
      const newCompanyAdmin = new CompanyAdmin({
        username,
        password: password
      });
      await newCompanyAdmin.save();

      // Generate a token valid for 3 hours
      const token = jwt.sign(
        { username },
        "hi", // Use your JWT secret from environment variables
        { expiresIn: "3h" }
      );

      return res.status(201).json({
        message: "New company admin created successfully",
        token // Send the generated JWT token
      });
    }

    const updateResult = await CompanyAdmin.updateOne(
      { username: username },
      { $set: { password: password } }
    );

    // If no documents are updated, it means there was no matching document
    if (updateResult.nModified === 0) {
      return res.status(404).json({ message: "No data to update" });
    }

    // Generate a token valid for 3 hours
    const token = jwt.sign(
      { username },
      "hi", // Use your JWT secret from environment variables
      { expiresIn: "3h" }
    );

    res.status(200).json({
      message: "Data updated successfully",
      token // Send the generated JWT token
    });
  } catch (error) {
    console.error("Error in loginBackend:", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
exports.checkBackendLogin = async (req, res) => {
  const { username, password } = req.body; // Extract username and password from the request body
  // console.log(username, password);
  // Check if both username and password are provided
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  try {
    // Find the existing document (assuming you're using a single document for the admin)
    const companyAdmin = await CompanyAdmin.findOne({});
    // console.log(companyAdmin, "companyAdmin");
    if (!companyAdmin) {
      return res.status(404).json({ message: "Admin data not found" });
    }

    // Compare the incoming data with the saved data
    // If the incoming username or password differs from the saved data, update it
    let updated = false;

    if (companyAdmin.username !== username) {
      companyAdmin.username = username; // Update username
      updated = true;
    }

    if (companyAdmin.password !== password) {
      companyAdmin.password = password; // Update password
      updated = true;
    }

    // If there were any changes, save the updated document
    if (updated) {
      await companyAdmin.save(); // Save the changes to the database
    }

    // Simulate a token response (replace with actual token generation if needed)
    const token = jwt.sign(
      { username },
      "hi", // Use your JWT secret
      { expiresIn: "3h" }
    );

    // Send success response with token
    res.status(200).json({
      message: "Login successful",
      token // Send the generated JWT token
    });
    // const token = "dummyToken12345"; // Replace with actual token generation logic if needed

    // Return the updated response
    // res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while updating the data", error });
  }
};

exports.deleteUserData = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    // Find and delete the user using the correct query
    const deletedUser = await IdentityUser.findOneAndDelete({ UserId: id });

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

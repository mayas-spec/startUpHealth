// Handling errors globally
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  // this logs the full error details to help me debug issues during development
  
  // ValidationError happens when mongoose validation fails (like required fields missing, wrong data types, etc)
  if(err.name === 'ValidationError'){
      const errors = Object.values(err.errors).map(e => e.message);
      // this extracts all the validation error messages into an array so i can show them to the user
      return res.status(400).json({
          message: 'Validation Error',
          errors 
      })
  }
  
  // CastError typically occurs in MongoDB/Mongoose when trying to use an invalid ObjectId format (like passing a string that can't be converted to a valid MongoDB ObjectId)
  if(err.name === 'CastError'){
      return res.status(400).json({
          message: 'Invalid ID format'
      })
  }
  
  // Error code 11000 in MongoDB indicates a duplicate key error (violation of a unique index constraint)
  if(err.code === 11000){
      // this happens when someone tries to create a user with an email that already exists (since email should be unique)
      return res.status(400).json({
          message: "Duplicate Field Value"
      })
  }
  
  // if none of the specific errors above match, send a generic server error
  res.status(500).json({
      message: "Internal Server Error" 
  })
}

module.exports = errorHandler;
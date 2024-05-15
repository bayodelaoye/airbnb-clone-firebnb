const express = require("express");
const { Spot, User, SpotImage, Review, Booking } = require("../../db/models");
const { where } = require("sequelize");

const router = express.Router();

const populateRatingAndImageColumn = async () => {
  const spots = await Spot.findAll();
  const previewImages = await SpotImage.findAll({
    where: {
      preview: true,
    },
  });

  const avgRatingArray = [];

  for (let i = 1; i <= spots.length; i++) {
    let ratingAmount = 0;

    const reviewSpecificSpotId = await Review.findAll({
      where: {
        spotId: i,
      },
    });

    for (let j = 0; j < reviewSpecificSpotId.length; j++) {
      ratingAmount += reviewSpecificSpotId[j].stars;
    }
    avgRatingArray.push(ratingAmount / reviewSpecificSpotId.length);
  }

  for (let k = 0; k < spots.length; k++) {
    spots[k].avgRating = avgRatingArray[k];
    spots[k].previewImage = previewImages[k].url;

    await spots[k].save();
  }

  return spots;
};

router.get("/", async (req, res) => {
  const { user } = req;

  if (user) {
    const spots = await populateRatingAndImageColumn();
    res.json(spots);
  } else {
    res.statusCode = 401;
    res.json({ message: "Authentication required" });
  }
});

router.post("/", async (req, res) => {
  const { user } = req;
  const error = {
    message: {},
    errors: {},
  };

  if (user) {
    const {
      ownerId,
      address,
      city,
      state,
      country,
      lat,
      lng,
      name,
      description,
      price,
    } = req.body;

    const numberOUsers = await User.findAll();

    if (
      ownerId &&
      address &&
      city &&
      state &&
      country &&
      lat &&
      lng &&
      name &&
      description &&
      price
    ) {
      if (numberOUsers.length < ownerId) {
        res.statusCode = 500;
        res.json({ message: `There is no owner with the id of ${ownerId}` });
      }

      const newSpot = await Spot.create({
        ownerId,
        address,
        city,
        state,
        country,
        lat,
        lng,
        name,
        description,
        price,
      });

      res.json(newSpot);
    } else {
      const spotObj = {
        ownerId,
        address,
        city,
        state,
        country,
        lat,
        lng,
        name,
        description,
        price,
      };

      res.statusCode = 400;
      error.message = "Bad Request";

      for (let key in spotObj) {
        if (spotObj[key] === undefined || spotObj[key] === "") {
          error["errors"][key] = key + " is required";
        }
      }

      return res.json(error);
    }
  } else {
    res.statusCode = 401;
    res.json({ message: "Authentication required" });
  }
});

router.post("/:spotId/images", async (req, res) => {
  const { user } = req;
  const error = {
    message: {},
    errors: {},
  };

  if (user) {
    const userSpots = await Spot.findAll({
      where: {
        ownerId: user.id,
      },
    });

    if (userSpots.length === 0) {
      res.statusCode = 403;
      res.json({ message: "Forbidden" });
    }

    const { url, preview } = req.body;

    const spot = await Spot.findByPk(req.params.spotId);

    if (url && preview) {
      if (spot === null) {
        res.statusCode = 500;
        res.json({
          message: `Spot couldn't be found`,
        });
      }

      const spotImages = await SpotImage.findAll({
        where: {
          spotId: spot.id,
        },
      });

      if (preview === true && spotImages.length > 0) {
        for (let i = 0; i < spotImages.length; i++) {
          if (spotImages[i].preview === true) {
            spotImages[i].preview = false;

            await spotImages[i].save();
          }
        }
      }

      const spotImage = await SpotImage.create({
        spotId: spot.id,
        url,
        preview,
      });

      res.json(spotImage);
    } else {
      const spotImageObj = {
        url,
        preview,
      };

      res.statusCode = 400;
      error.message = "Bad Request";

      for (let key in spotImageObj) {
        if (spotImageObj[key] === undefined || spotImageObj[key] === "") {
          error["errors"][key] = key + " is required";
        }
      }

      return res.json(error);
    }
  } else {
    res.statusCode = 401;
    res.json({ message: "Authentication required" });
  }
});

router.get("/current", async (req, res) => {
  const spots = await populateRatingAndImageColumn();
  const { user } = req;

  if (user) {
    const safeUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
    };

    const userSpots = await Spot.findAll({
      where: {
        ownerId: safeUser.id,
      },
    });

    return res.json({
      Spots: userSpots,
    });
  } else {
    res.statusCode = 401;
    return res.json({ message: "Authentication required" });
  }
});

router.get("/:spotId", async (req, res) => {
  const { user } = req;

  if (user) {
    const spot = await Spot.findByPk(req.params.spotId, {
      include: [{ model: SpotImage }, { model: User, as: "Owner" }],
    });

    if (!spot) {
      res.statusCode = 404;
      res.json({ message: "Spot couldn't be found" });
    }
    res.json(spot);
  } else {
    res.statusCode = 401;
    res.json({ message: "Authentication required" });
  }
});

router.put("/:spotId", async (req, res) => {
  const { user } = req;
  const error = {
    message: {},
    errors: {},
  };

  if (user) {
    const userSpots = await Spot.findAll({
      where: {
        ownerId: user.id,
      },
    });

    if (userSpots.length === 0) {
      res.statusCode = 403;
      res.json({ message: "Forbidden" });
    }

    const {
      address,
      city,
      state,
      country,
      lat,
      lng,
      name,
      description,
      price,
    } = req.body;

    const spot = await Spot.findByPk(req.params.spotId);

    if (!spot) {
      res.statusCode = 404;
      res.json({ message: "Spot couldn't be found" });
    }

    if (
      address &&
      city &&
      state &&
      country &&
      lat &&
      lng &&
      name &&
      description &&
      price
    ) {
      spot.address = address;
      spot.city = city;
      spot.state = state;
      spot.country = country;
      spot.lat = lat;
      spot.lng = lng;
      spot.name = name;
      spot.description = description;
      spot.price = price;

      await spot.save();

      res.json(spot);
    } else {
      const spotObj = {
        address,
        city,
        state,
        country,
        lat,
        lng,
        name,
        description,
        price,
      };

      res.statusCode = 400;
      error.message = "Bad Request";

      for (let key in spotObj) {
        if (spotObj[key] === undefined || spotObj[key] === "") {
          error["errors"][key] = key + " is required";
        }
      }

      return res.json(error);
    }
  } else {
    res.statusCode = 401;
    res.json({ message: "Authentication required" });
  }
});

router.delete("/:spotId", async (req, res) => {
  const { user } = req;
  if (user) {
    const spot = await Spot.findByPk(req.params.spotId);

    if (!spot) {
      res.statusCode = 404;
      res.json({ message: "Spot couldn't be found" });
    } else {
      const userSpot = await Spot.findOne({
        where: {
          ownerId: user.id,
        },
      });

      if (!userSpot) {
        res.statusCode = 403;
        res.json({ message: "Forbidden" });
      } else {
        await spot.destroy();

        res.json({ message: "Successfully deleted" });
      }
    }
  } else {
    res.statusCode = 401;
    res.json({ message: "Authentication required" });
  }
});

router.post("/:spotId/reviews", async (req, res) => {
  const { user } = req;
  const reviewsSet = new Set();
  const error = {
    message: {},
    errors: {},
  };

  if (user) {
    const { review, stars } = req.body;

    const spot = await Spot.findByPk(req.params.spotId);
    const reviews = await Review.findAll();

    if (!spot) {
      res.statusCode = 404;
      res.json({ message: "Spot couldn't be found" });
    }

    for (let i = 0; i < reviews.length; i++) {
      reviewsSet.add(`${reviews[i].userId}, ${reviews[i].spotId}`);
    }

    if (review && stars) {
      if (reviewsSet.has(`${user.id}, ${req.params.spotId}`)) {
        res.statusCode = 400;
        res.json({ message: "can only leave one review per spot" });
      }

      const newReview = await Review.create({
        userId: user.id,
        spotId: req.params.spotId,
        review,
        stars,
      });

      res.json(newReview);
    } else {
      const reviewObj = {
        review,
        stars,
      };

      res.statusCode = 400;
      error.message = "Bad Request";

      for (let key in reviewObj) {
        if (reviewObj[key] === undefined || reviewObj[key] === "") {
          error["errors"][key] = key + " is required";
        }
      }

      return res.json(error);
    }
  } else {
    res.statusCode = 401;
    res.json({ message: "Authentication required" });
  }
});

router.get("/:spotId/reviews", async (req, res) => {
  const { user } = req;

  if (user) {
    const spot = await Spot.findByPk(req.params.spotId);

    if (!spot) {
      res.statusCode = 404;
      res.json({ message: "Spot couldn't be found" });
    }

    const reviews = await Review.findAll({
      where: {
        spotId: req.params.spotId,
      },
    });

    res.json(reviews);
  } else {
    res.statusCode = 401;
    res.json({ message: "Authentication required" });
  }
});

router.post("/:spotId/bookings", async (req, res) => {
  const { user } = req;
  const bookingSet = new Set();
  let isValidStartDate = null;
  let isValidEndDate = null;
  let isConflictingBooking = null;
  const error = {
    message: {},
    errors: {},
  };

  if (user) {
    let { startDate, endDate } = req.body;

    const bookings = await Booking.findAll({
      where: {
        spotId: req.params.spotId,
      },
    });

    const spot = await Spot.findByPk(req.params.spotId);

    startDate = new Date(startDate);
    endDate = new Date(endDate);

    if (startDate && endDate) {
      if (!spot) {
        res.statusCode = 404;
        res.json({ message: "Spot couldn't be found" });
      } else {
        const ownerSpot = await Spot.findOne({
          where: {
            id: req.params.spotId,
            ownerId: user.id,
          },
        });

        if (ownerSpot) {
          res.statusCode = 403;
          res.json({ message: "Forbidden" });
        } else {
          for (let i = 0; i < bookings.length; i++) {
            bookingSet.add(`startDate: ${bookings[i].startDate}`);
            bookingSet.add(`endDate: ${bookings[i].endDate}`);

            if (
              startDate.getTime() ===
                new Date(bookings[i].startDate).getTime() &&
              endDate.getTime() === new Date(bookings[i].endDate).getTime()
            ) {
              isConflictingBooking = true;
            }

            if (
              startDate > bookings[i].startDate &&
              startDate < bookings[i].endDate
            ) {
              isValidStartDate = false;
            }

            if (
              endDate > bookings[i].startDate &&
              endDate < bookings[i].endDate
            ) {
              isValidEndDate = false;
            }

            if (
              startDate > bookings[i].startDate &&
              startDate < bookings[i].endDate &&
              endDate > bookings[i].startDate &&
              endDate < bookings[i].endDate
            ) {
              isValidStartDate = "dates within";
              isValidEndDate = "dates within";
            }

            if (
              startDate < bookings[i].startDate &&
              endDate > bookings[i].endDate
            ) {
              isValidStartDate = "dates surround";
              isValidEndDate = "dates surround";
            }
          }

          if (new Date(startDate) < Date.now()) {
            error.message = "Dates cannot be in the past";
            error["errors"].startDate = "The start date cannot be in the past";
            res.json(error);
          } else if (isConflictingBooking) {
            res.statusCode = 400;
            error.message =
              "Sorry, this spot is already booked for the specified dates";
            error["errors"].startDate =
              "Start date conflicts with an existing booking";
            error["errors"].endDate =
              "End date conflicts with an existing booking";
            res.json(error);
          } else if (startDate.toString() === endDate.toString()) {
            res.statusCode = 400;
            error.message = "Bad Request";
            error["errors"].startDate =
              "Canot book a spot with the same start and end date";
            error["errors"].endDate =
              "Canot book a spot with the same start and end date";
            res.json(error);
          } else if (startDate > endDate) {
            res.statusCode = 400;
            error.message = "Bad Request";
            error["errors"].startDate = "Start date must be before end date";
            error["errors"].endDate = "Start date must be before end date";
            res.json(error);
          } else if (bookingSet.has(`startDate: ${startDate}`)) {
            res.statusCode = 400;
            error.message = "Bad Request";
            error["errors"].startDate =
              "A booking with this start date already exists";
            error["errors"].endDate =
              "A booking with this start date already exists";
            res.json(error);
          } else if (bookingSet.has(`endDate: ${startDate}`)) {
            res.statusCode = 400;
            error.message = "Bad Request";
            error["errors"].startDate =
              "You cannot make a booking, as the start date is the same as an already existsing end date i.e. the date that someone is leaving";
            error["errors"].endDate =
              "You cannot make a booking, as the start date is the same as an already existsing end date i.e. the date that someone is leaving";
            res.json(error);
          } else if (bookingSet.has(`startDate: ${endDate}`)) {
            res.statusCode = 400;
            error.message = "Bad Request";
            error["errors"].startDate =
              "Cannot make a booking. The end date is the same as an already existsing start date";
            error["errors"].endDate =
              "Cannot make a booking. The end date is the same as an already existsing start date";
            res.json(error);
          } else if (bookingSet.has(`endDate: ${endDate}`)) {
            res.statusCode = 400;
            error.message = "Bad Request";
            error["errors"].startDate =
              "A booking with this end date already exists";
            error["errors"].endDate =
              "A booking with this end date already exists";
            res.json(error);
          } else if (isValidStartDate === false) {
            res.statusCode = 400;
            error.message = "Bad Request";
            error["errors"].startDate =
              "Start date cannot be during an existing booking";
            error["errors"].endDate =
              "Start date cannot be during an existing booking";
            res.json(error);
          } else if (isValidEndDate === false) {
            res.statusCode = 400;
            error.message = "Bad Request";
            error["errors"].startDate =
              "End date cannot be during an existing booking";
            error["errors"].endDate =
              "End date cannot be during an existing booking";
            res.json(error);
          } else if (
            isValidStartDate === "dates within" &&
            isValidEndDate === "dates within"
          ) {
            res.statusCode = 400;
            error.message = "Bad Request";
            error["errors"].startDate =
              "Dates cannot be within an existing booking";
            error["errors"].endDate =
              "Dates cannot be within an existing booking";
            res.json(error);
          } else if (
            isValidStartDate === "dates surround" &&
            isValidEndDate === "dates surround"
          ) {
            res.statusCode = 400;
            error.message = "Bad Request";
            error["errors"].startDate =
              "Dates cannot surround an existing booking";
            error["errors"].endDate =
              "Dates cannot surround an existing booking";
            res.json(error);
          } else {
            const booking = await Booking.create({
              userId: user.id,
              spotId: req.params.spotId,
              startDate,
              endDate,
            });
            res.json(booking);
          }
        }
      }
    } else {
      const bookingObj = {
        startDate,
        endDate,
      };

      res.statusCode = 400;
      error.message = "Bad Request";

      for (let key in bookingObj) {
        if (bookingObj[key] === undefined || bookingObj[key] === "") {
          error["errors"][key] = key + " is required";
        }
      }

      return res.json(error);
    }
  } else {
    res.statusCode = 401;
    res.json({ message: "Authentication required" });
  }
});

router.get("/:spotId/bookings", async (req, res) => {
  const { user } = req;

  if (user) {
    const spot = await Spot.findByPk(req.params.spotId);

    if (!spot) {
      res.statusCode = 404;
      res.json({ message: "Spot couldn't be found" });
    }

    if (user.id === spot.ownerId) {
      const bookings = await Booking.findAll({
        where: {
          spotId: spot.id,
        },
        include: [{ model: User }],
      });

      res.json({ Bookings: bookings });
    } else {
      const bookings = await Booking.findAll({
        where: {
          spotId: spot.id,
        },
      });

      res.json({ Bookings: bookings });
    }
  } else {
    res.statusCode = 401;
    res.json({ message: "Authentication required" });
  }
});

module.exports = router;

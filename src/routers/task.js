const express = require("express");
const Task = require("../models/task");
const auth = require("../middleware/auth");

const router = new express.Router();

/* ============= Tasks ============= */
router.post("/tasks", auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id
  });

  try {
    await task.save();
    res.status(201).send(task);
  } catch (err) {
    res.status(500).send();
  }
});

// GET /tasks?completed=true
// GET /tasks?limit=10&skip=20
// GET /tasks?sortBy=createdAt_desc

router.get("/tasks", auth, async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split("_");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }

  try {
    await req.user
      .populate({
        path: "tasks",
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort
        }
      })
      .execPopulate();
    res.send(req.user.tasks);
  } catch (err) {
    res.status(500).send();
  }
});

router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const task = await Task.findOne({ _id, owner: req.user._id });

    if (!task) {
      return res.status(404).send();
    }

    res.send(task);
  } catch (err) {
    res.status(500).send();
  }
});

router.patch("/tasks/:id", auth, async (req, res) => {
  // Get all keys from the input object
  const updates = Object.keys(req.body);

  // properties which are allowed to update
  const allowedUpdates = ["description", "completed"];

  // Check if inputs are in `allowedUpdates`
  const isValidOperation = updates.every(task => allowedUpdates.includes(task));

  // if not a valid operation
  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!task) {
      return res.status(404).send();
    }

    updates.forEach(update => (task[update] = req.body[update]));
    await task.save();

    res.send(task);
  } catch (err) {
    res.status(400).send();
  }
});

router.delete("/tasks/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!task) {
      return res.status(404).send();
    }

    res.send(task);
  } catch (err) {
    res.status(500).send();
  }
});

module.exports = router;

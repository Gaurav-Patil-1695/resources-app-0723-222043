const returnsService = require('./returns.service');

const createReturnRequest = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const customerId = req.user.id;
    const payload = req.body;
    const returnRequest = await returnsService.initiateReturn(orderId, customerId, payload);
    return res.status(201).json({ data: returnRequest });
  } catch (err) {
    next(err);
  }
};

const getReturnRequestByOrder = async (req, res, next) => {
  try {
    const { orderId, returnRequestId } = req.params;
    const customerId = req.user.id;
    const returnRequest = await returnsService.getReturnRequestByOrder(
      orderId,
      returnRequestId,
      customerId
    );
    return res.status(200).json({ data: returnRequest });
  } catch (err) {
    next(err);
  }
};

const listReturnRequests = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 20,
    };
    const result = await returnsService.listReturnRequests(filters);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const getReturnRequest = async (req, res, next) => {
  try {
    const { returnRequestId } = req.params;
    const returnRequest = await returnsService.getReturnRequestById(returnRequestId);
    return res.status(200).json({ data: returnRequest });
  } catch (err) {
    next(err);
  }
};

const reviewReturnRequest = async (req, res, next) => {
  try {
    const { returnRequestId } = req.params;
    const reviewerId = req.user.id;
    const payload = req.body;
    const updated = await returnsService.reviewReturnRequest(returnRequestId, reviewerId, payload);
    return res.status(200).json({ data: updated });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createReturnRequest,
  getReturnRequestByOrder,
  listReturnRequests,
  getReturnRequest,
  reviewReturnRequest,
};

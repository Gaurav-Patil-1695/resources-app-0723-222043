const addressesService = require('./addresses.service');
const { validationResult } = require('express-validator');

const getAddresses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const addresses = await addressesService.getAddressesByUserId(userId);
    return res.status(200).json({ success: true, data: addresses });
  } catch (err) {
    next(err);
  }
};

const getAddressById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    const address = await addressesService.getAddressById(userId, addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found.' });
    }
    return res.status(200).json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
};

const createAddress = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    const userId = req.user.id;
    const address = await addressesService.createAddress(userId, req.body);
    return res.status(201).json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    const userId = req.user.id;
    const { addressId } = req.params;
    const address = await addressesService.updateAddress(userId, addressId, req.body);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found.' });
    }
    return res.status(200).json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    const deleted = await addressesService.deleteAddress(userId, addressId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Address not found.' });
    }
    return res.status(200).json({ success: true, message: 'Address deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
};

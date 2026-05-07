import Joi from 'joi';

export const telemetryPayloadSchema = Joi.object({
  tenantId: Joi.string().required(),
  deviceId: Joi.string().required(),
  hours: Joi.number().min(0).required(),
  mileage: Joi.number().min(0).required(),
  engineTemp: Joi.number().required(),
  timestamp: Joi.date().iso().required(),
});

export const maintenanceRulePayloadSchema = Joi.object({
  tenantId: Joi.string().required(),
  assetId: Joi.string().uuid().required(),
  name: Joi.string().required(),
  metric: Joi.string().valid('hours', 'mileage').required(),
  threshold: Joi.number().min(0).required(),
});

export const tenantIdQuerySchema = Joi.object({
  tenantId: Joi.string().required(),
});

'use strict';

import sequelizeDB from './';
import models from '../models/index';

const model = models.init(sequelizeDB);

module.exports = model;
/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} name
 * @property {Date} startDate
 * @property {Date} endDate
 * @property {number} progress
 * @property {string} [parentId]
 * @property {string} color
 * @property {string[]} [dependencies]
 */

/**
 * @typedef {Object} GanttConfig
 * @property {'day' | 'week' | 'month'} viewMode
 * @property {number} columnWidth
 * @property {number} rowHeight
 */

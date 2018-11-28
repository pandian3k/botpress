/**
 * Store data easily for different time periods.
 * user: never expires
 * session: ends when the user's session is finished
 * temp: ends as soon as the flow is finished
 *
 * @title Set Variable
 * @category Storage
 * @author Botpress, Inc.
 * @param {string} type - Pick between: user, session, temp
 * @param {string} name - The name of the variable
 * @param {any} value - Set the value of the variable
 */
const setVariable = async (type, name, value) => {
  event.state[type][name] = value !== 'null' ? value : undefined
}

return setVariable(args.type, args.name, args.value)
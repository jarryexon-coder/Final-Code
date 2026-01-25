// Fresh admin controller
export const listUsers = async (r, s) => s.json({success:true,m:"listUsers"});
export const getUserDetails = async (r, s) => s.json({success:true,m:"getUserDetails"});
export const getUserPrizePicks = async (r, s) => s.json({success:true,m:"getUserPrizePicks"});
export const resetUserLimit = async (r, s) => s.json({success:true,m:"resetUserLimit"});
export const updateUserStatus = async (r, s) => s.json({success:true,m:"updateUserStatus"});
export const deleteUser = async (r, s) => s.json({success:true,m:"deleteUser"});
export const batchGenerateSelections = async (r, s) => s.json({success:true,m:"batchGenerateSelections"});
export const getGenerationStats = async (r, s) => s.json({success:true,m:"getGenerationStats"});
export const removeSelection = async (r, s) => s.json({success:true,m:"removeSelection"});
export const forceGenerate = async (r, s) => s.json({success:true,m:"forceGenerate"});

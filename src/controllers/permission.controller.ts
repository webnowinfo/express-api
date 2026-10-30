import catchAsync from '../utils/catchAsync';
import { permissionService } from '../services';

const getPermissions = catchAsync(async (req, res) => {
  const permissions = await permissionService.getUserPermissions(BigInt(req.params.userId));
  res.send(permissions);
});

// route uses authStrict('manageUsers'): nobody may grant themselves permissions
const updatePermissions = catchAsync(async (req, res) => {
  const permissions = await permissionService.updateUserPermissions(
    BigInt(req.params.userId),
    req.body
  );
  res.send(permissions);
});

export default {
  getPermissions,
  updatePermissions
};

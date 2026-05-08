export class ChangePasswordRequest {
    CurrentUser: string;
    CurrentPassword: string;
    NewPassword: string;

    constructor(currentUser: string, currentPassword: string, newPassword: string) {
        this.CurrentUser = currentUser;
        this.CurrentPassword = currentPassword;
        this.NewPassword = newPassword;
    }
}

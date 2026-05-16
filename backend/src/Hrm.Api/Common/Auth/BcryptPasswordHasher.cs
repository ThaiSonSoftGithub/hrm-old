namespace Hrm.Api.Common.Auth;

public sealed class BcryptPasswordHasher : IPasswordHasher
{
    public string Hash(string password) => BCrypt.Net.BCrypt.HashPassword(password, workFactor: 11);
    public bool Verify(string password, string hash) =>
        !string.IsNullOrEmpty(hash) && BCrypt.Net.BCrypt.Verify(password, hash);
}

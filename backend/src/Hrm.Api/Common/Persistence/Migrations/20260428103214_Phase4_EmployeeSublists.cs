using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hrm.Api.Common.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase4_EmployeeSublists : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EmployeeCertificates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CertificateTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CertificateName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    CertificateNumber = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    EducationLevelId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IssuedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ExpiryDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IssuedPlace = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    CertificateClassificationId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmployeeCertificates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EmployeeDegrees",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EducationPlaceId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FromYear = table.Column<int>(type: "int", nullable: true),
                    ToYear = table.Column<int>(type: "int", nullable: true),
                    EducationFacultyId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    EducationMajorId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    EducationLevelId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    EducationMethodId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DegreeClassificationId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    GraduationYear = table.Column<int>(type: "int", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmployeeDegrees", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EmployeeWorkExperiences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FromMonthYear = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    ToMonthYear = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    WorkplaceName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    JobTitleText = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    SalaryAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    JobDescription = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Note = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    ReferenceName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    ReferenceJobTitle = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    ReferencePhone = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: true),
                    ReferenceEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmployeeWorkExperiences", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EmployeeWorkHistories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FromDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ToDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsCurrent = table.Column<bool>(type: "bit", nullable: false),
                    JobPositionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    JobTitleId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    OrganizationUnitId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DepartmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DirectManagerEmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DecisionNumber = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    DecisionDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmployeeWorkHistories", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeCertificates_CertificateTypeId",
                table: "EmployeeCertificates",
                column: "CertificateTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeCertificates_EmployeeId",
                table: "EmployeeCertificates",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeDegrees_EmployeeId",
                table: "EmployeeDegrees",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeWorkExperiences_EmployeeId",
                table: "EmployeeWorkExperiences",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeWorkHistories_DepartmentId",
                table: "EmployeeWorkHistories",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeWorkHistories_EmployeeId",
                table: "EmployeeWorkHistories",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeWorkHistories_JobPositionId",
                table: "EmployeeWorkHistories",
                column: "JobPositionId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeWorkHistories_OrganizationUnitId",
                table: "EmployeeWorkHistories",
                column: "OrganizationUnitId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EmployeeCertificates");

            migrationBuilder.DropTable(
                name: "EmployeeDegrees");

            migrationBuilder.DropTable(
                name: "EmployeeWorkExperiences");

            migrationBuilder.DropTable(
                name: "EmployeeWorkHistories");
        }
    }
}

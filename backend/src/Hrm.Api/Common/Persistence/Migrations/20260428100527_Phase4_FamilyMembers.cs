using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hrm.Api.Common.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase4_FamilyMembers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EmployeeFamilyMembers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RelationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Gender = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                    DateOfBirth = table.Column<DateTime>(type: "datetime2", nullable: true),
                    BirthYearOnly = table.Column<bool>(type: "bit", nullable: false),
                    NationalityCountryId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IdentityOrPassportNumber = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    Address = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    MobilePhone = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: true),
                    HomePhone = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Occupation = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    PersonalTaxCode = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: true),
                    Workplace = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    SameHouseholdBook = table.Column<bool>(type: "bit", nullable: false),
                    IsHouseholdHead = table.Column<bool>(type: "bit", nullable: false),
                    IsDependent = table.Column<bool>(type: "bit", nullable: false),
                    IsDeceased = table.Column<bool>(type: "bit", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmployeeFamilyMembers", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeFamilyMembers_EmployeeId",
                table: "EmployeeFamilyMembers",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeFamilyMembers_RelationId",
                table: "EmployeeFamilyMembers",
                column: "RelationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EmployeeFamilyMembers");
        }
    }
}

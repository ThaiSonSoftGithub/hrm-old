using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hrm.Api.Common.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase4_Employee_Tab2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BirthPlace",
                table: "Employees",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BloodGroupText",
                table: "Employees",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CurrentResidenceAddressLine",
                table: "Employees",
                type: "nvarchar(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CurrentResidenceCountryId",
                table: "Employees",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CurrentResidenceDistrictId",
                table: "Employees",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CurrentResidenceProvinceId",
                table: "Employees",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CurrentResidenceWardId",
                table: "Employees",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DegreeClassificationId",
                table: "Employees",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "EducationFacultyId",
                table: "Employees",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "EducationLevelId",
                table: "Employees",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "EducationMajorId",
                table: "Employees",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "EducationPlaceId",
                table: "Employees",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmergencyAddress",
                table: "Employees",
                type: "nvarchar(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmergencyContactName",
                table: "Employees",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmergencyEmail",
                table: "Employees",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmergencyHomePhone",
                table: "Employees",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmergencyMobilePhone",
                table: "Employees",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "EmergencyRelationId",
                table: "Employees",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "EthnicityId",
                table: "Employees",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Facebook",
                table: "Employees",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "FamilyBackgroundId",
                table: "Employees",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FamilyHouseholdCode",
                table: "Employees",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GeneralEducationLevel",
                table: "Employees",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GraduationYear",
                table: "Employees",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HealthStatusText",
                table: "Employees",
                type: "nvarchar(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HeightText",
                table: "Employees",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HomePhone",
                table: "Employees",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HouseholdBookNumber",
                table: "Employees",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "IdentityExpiryDate",
                table: "Employees",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "IdentityIssueDate",
                table: "Employees",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "IdentityIssueProvinceId",
                table: "Employees",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IdentityNumber",
                table: "Employees",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsHouseholdHead",
                table: "Employees",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "MaritalStatusId",
                table: "Employees",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "NationalityCountryId",
                table: "Employees",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NativePlaceAddressLine",
                table: "Employees",
                type: "nvarchar(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "NativePlaceCountryId",
                table: "Employees",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "NativePlaceDistrictId",
                table: "Employees",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "NativePlaceProvinceId",
                table: "Employees",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "NativePlaceWardId",
                table: "Employees",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OfficeEmail",
                table: "Employees",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OfficePhone",
                table: "Employees",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OtherEmail",
                table: "Employees",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OtherPhone",
                table: "Employees",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PartyCardNumber",
                table: "Employees",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PartyJoinDate",
                table: "Employees",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PartyJoinPlace",
                table: "Employees",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PassportExpiryDate",
                table: "Employees",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PassportIssueDate",
                table: "Employees",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PassportIssueProvinceId",
                table: "Employees",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PassportNumber",
                table: "Employees",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PermanentResidenceAddressLine",
                table: "Employees",
                type: "nvarchar(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PermanentResidenceCountryId",
                table: "Employees",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PermanentResidenceDistrictId",
                table: "Employees",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PermanentResidenceProvinceId",
                table: "Employees",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PermanentResidenceWardId",
                table: "Employees",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PersonalBackgroundId",
                table: "Employees",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReligionId",
                table: "Employees",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "SameAsPermanentResidence",
                table: "Employees",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "UnionCardNumber",
                table: "Employees",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UnionJoinDate",
                table: "Employees",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UnionJoinPlace",
                table: "Employees",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WeightText",
                table: "Employees",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BirthPlace",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "BloodGroupText",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "CurrentResidenceAddressLine",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "CurrentResidenceCountryId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "CurrentResidenceDistrictId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "CurrentResidenceProvinceId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "CurrentResidenceWardId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "DegreeClassificationId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "EducationFacultyId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "EducationLevelId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "EducationMajorId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "EducationPlaceId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "EmergencyAddress",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "EmergencyContactName",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "EmergencyEmail",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "EmergencyHomePhone",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "EmergencyMobilePhone",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "EmergencyRelationId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "EthnicityId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "Facebook",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "FamilyBackgroundId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "FamilyHouseholdCode",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "GeneralEducationLevel",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "GraduationYear",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "HealthStatusText",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "HeightText",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "HomePhone",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "HouseholdBookNumber",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "IdentityExpiryDate",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "IdentityIssueDate",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "IdentityIssueProvinceId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "IdentityNumber",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "IsHouseholdHead",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "MaritalStatusId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "NationalityCountryId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "NativePlaceAddressLine",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "NativePlaceCountryId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "NativePlaceDistrictId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "NativePlaceProvinceId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "NativePlaceWardId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "OfficeEmail",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "OfficePhone",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "OtherEmail",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "OtherPhone",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "PartyCardNumber",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "PartyJoinDate",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "PartyJoinPlace",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "PassportExpiryDate",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "PassportIssueDate",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "PassportIssueProvinceId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "PassportNumber",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "PermanentResidenceAddressLine",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "PermanentResidenceCountryId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "PermanentResidenceDistrictId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "PermanentResidenceProvinceId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "PermanentResidenceWardId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "PersonalBackgroundId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "ReligionId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "SameAsPermanentResidence",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "UnionCardNumber",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "UnionJoinDate",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "UnionJoinPlace",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "WeightText",
                table: "Employees");
        }
    }
}

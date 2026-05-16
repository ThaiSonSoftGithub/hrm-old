using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hrm.Api.Common.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase4_LaborContracts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LaborContracts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ContractNumber = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    ContractTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ContractDurationText = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    WorkingTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    JobPositionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DepartmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BaseSalary = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    InsuranceSalary = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    SalaryPercent = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    EffectiveStartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EffectiveEndDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SignerEmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    SignerJobTitleText = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    SignedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LaborContracts", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LaborContracts_ContractNumber",
                table: "LaborContracts",
                column: "ContractNumber");

            migrationBuilder.CreateIndex(
                name: "IX_LaborContracts_ContractTypeId",
                table: "LaborContracts",
                column: "ContractTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_LaborContracts_EmployeeId",
                table: "LaborContracts",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_LaborContracts_SignerEmployeeId",
                table: "LaborContracts",
                column: "SignerEmployeeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LaborContracts");
        }
    }
}

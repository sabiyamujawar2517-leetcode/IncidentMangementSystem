using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IncidentAgent.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddIncidentNumberSequence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateSequence(
                name: "incident_number_seq");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropSequence(
                name: "incident_number_seq");
        }
    }
}

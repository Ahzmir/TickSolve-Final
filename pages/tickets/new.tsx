import type { NextPage } from "next";
import Layout from "../../components/Layout";
import TicketComplaints from "../../components/TicketComplaints";

const NewTicket: NextPage = () => {
  return (
    <Layout title="New Ticket - TickSolve USTP">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Ticket</h1>
        <p className="mt-1 text-sm text-gray-600">
          Submit a new complaint or inquiry to the USTP administration.
        </p>
      </div>

      <TicketComplaints />
    </Layout>
  );
};

export default NewTicket;

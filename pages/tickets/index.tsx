import type { NextPage } from "next";
import Layout from "../../components/Layout";
import TicketHistory from "../../components/TicketHistory";
import Link from "next/link";

const Tickets: NextPage = () => {
  return (
    <Layout title="My Tickets - TickSolve USTP">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
          <p className="mt-1 text-sm text-gray-600">
            View and manage all your submitted tickets.
          </p>
        </div>
        <Link href="/tickets/new" className="btn btn-primary">
          New Ticket
        </Link>
      </div>

      <TicketHistory showPagination={true} />
    </Layout>
  );
};

export default Tickets;

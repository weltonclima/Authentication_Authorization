import { Can } from "../components/Can";
import { useAuth } from "../Contexts/AuthContext";
import { setupAPICLient } from "../services/api";
import { withSSRAuth } from "../utils/withSSRAuth";

interface DashboardProps {
  data: {
    email: string,
    permissions: string[],
    roles: string[]
  }
}

export default function Dashboard({ data }: DashboardProps) {
  const { signOut } = useAuth();
  return (
    <>
      <h1>
        Dasboard: {data.email}
      </h1>
      <button onClick={signOut}>Sign Out</button>
      <Can permissions={['metrics.list']} >
        <div>Métricas</div>
      </Can>
    </>
  )
}
export const getServerSideProps = withSSRAuth(async (ctx) => {
  const apiClient = setupAPICLient(ctx);

  const response = await apiClient.get('/me')

  return {
    props: {
      data: response.data
    }
  }
})
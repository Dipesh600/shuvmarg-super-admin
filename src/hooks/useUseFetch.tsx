import { getAllUsers } from "@/api/userApi";
import { useAuth } from "@/providers/AuthProvider";

const useUsersFetch = () => {
  const { admin, isAuthenticated } = useAuth();
  
  // Your implementation here
  const fetchUsers = async () => {
    try {
       // Fetch users logic
    if (isAuthenticated && admin) {
      const { data } = await getAllUsers();
      console.log("Fetched users : " ,data); 
     return data;
    } 
    } catch (error) {
        console.error("Error fetching users:",error);
    }
    
  };

  fetchUsers()
};

export default useUsersFetch;

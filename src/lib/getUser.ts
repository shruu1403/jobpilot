import { supabase} from './supabaseClient'

export const getUser = async () => {
    const {data} = await supabase.auth.getSession();
    return data?.session?.user;
}
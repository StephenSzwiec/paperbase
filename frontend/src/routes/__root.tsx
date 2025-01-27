import {
    createRootRouteWithContext, 
    Link,
    Outlet,
} from "@tanstack/react-router";
import { type QueryClient } from "@tanstack/react-query";

interface MyRouterContext {
    queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
    component: Root,
});

function NavBar() { 
    return (
        <div className="p-2 flex justify-between max-w-2xl m-auto items-baseline"> 
            <Link to="/"><h1 className="text-2xl font-bold">PaperBase</h1></Link>
            <div className="flex gap-2">
                <Link to="/about" className="[&.active]:font-bold">About</Link>
                <Link to="/papers" className="[&.active]:font-bold">Papers</Link>
                <Link to="/create" className="[&.active]:font-bold">Create Paper</Link>
            </div>
        </div>
    );
}

function Root() {
    return (
        <>
            <NavBar />
            <hr />
            <div className="p-2 max-w-2xl m-auto">
                <Outlet />
            </div>
            {/* <Footer /> */}
        </>
    );
}

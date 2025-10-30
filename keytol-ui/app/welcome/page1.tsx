export default function Page1View() {
    async function Init() {
        const req = await fetch("/hello",{
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            }
        });

        const res = await req.text();
        console.log(res);
    }

    Init();

    return (
        <div>
            <h1>Hello Page1</h1>
        </div>
    )
}

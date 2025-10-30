import { Link, Route, Router } from "react-router"
import { Routes } from "react-router"
import Page1 from "~/routes/page1"

export function Welcome() {
    return (
        <div>
            <nav>
                <ul>
                    <li>
                        <Link to="/page1">Page1</Link>
                    </li>
                    <li>
                        <Link to="/page2">Page2</Link>
                    </li>
                    <li>
                        <Link to="/page3">Page3</Link>
                    </li>
                </ul>
            </nav>
            <h1>hello world</h1>
        </div>
    )
}

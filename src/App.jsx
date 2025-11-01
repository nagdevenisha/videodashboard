import { BrowserRouter, Route ,Routes} from 'react-router'
import Home from './Components/Home.jsx'


function App() {

  return (
    <>
      <BrowserRouter>
          <Routes>
            <Route path='/' element={<Home/>}></Route>
          </Routes>
      </BrowserRouter>
        
    </>
  )
}

export default App

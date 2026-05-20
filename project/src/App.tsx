
import Header from './components/layout/Header';
import Main from './components/layout/Main';
import Footer from './components/layout/Footer';
import './App.css';  //css 

function App() {
  
  // connect test
  fetch('http://localhost:3000/api/health')
  .then(res => res.json())
  .then(data => console.log(data));

  return (
    <div > 

      <Header />
      <Main />
      <Footer />

    </div>
  );
}

export default App;
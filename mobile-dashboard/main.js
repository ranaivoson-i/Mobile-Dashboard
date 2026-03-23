const container = document.getElementById("cards");
const createCard = (title, content) =>{
    return `<div class="cards">
    <h2>${title}</h2>
    <p>${content}</p>
    </div>`;
};
const fetchData = async () => {

    const res = await fetch("http://localhost:3000/api/data");
    const data = await res.json();

    container.innerHTML = data.map(item =>
        createCard(item.title, item.content)
    ).join("");
    
    
} ;



fetchData();
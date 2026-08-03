
const modeToggle = document.getElementById('mode-toggle');
const singleSearchUi = document.getElementById('single-search-ui');
const battleUi = document.getElementById('battle-Ui');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

const user1Input = document.getElementById('user1-input');
const user2Input= document.getElementById('user2-input');
const battleBtn= document.getElementById('battle-btn');
const loadingDiv= document.getElementById('loading');
const errorDiv = document.getElementById('error-message');
const resultContainer= document.getElementById('result-container');

modeToggle.addEventListener('change',(e) =>{
    resetUI();
    if(e.target.checked){
        singleSearchUi.classList.add('hidden');
        battleUi.classList.remove('hidden');
    }else{
        singleSearchUi.classList.remove('hidden');
        battleUi.classList.add('hidden');
    }
   
});

// event listener for buttons

searchBtn.addEventListener('click',handleSingleSearch);
battleBtn.addEventListener('click',handleBattle);

function resetUI(){
    errorDiv.classList.add('hidden');
    resultContainer.innerHTML='';
}

// ISO Timestamp formatter utility function

function formDate(isoString){

    if(!isoString) return 'N/A';
    const date = new Date(isoString);
    const option ={date:'numeric',month:'short',year:'numeric'};
    return date.toLocaleDateString('en-GB',option);

}

// main logic for fetching user profile and chained repos

async function getUserData(username) {

    const userRes = await fetch(`https://api.github.com/users/${username}`);

    if(userRes.status === 404){
        throw new Error ('User Not Found');
    }
    if(!userRes.ok){
        throw new Error ('API Error');
    }
    const userData = await userRes.json();

    // endpoint chaining

    const reposRes = await fetch (userData.repos_url);
    let reposData =[];
    if(reposRes.ok){
        reposData = await reposRes.json();
    }

    // list rendering preparation

    const topRepos = reposData
    .sort((a,b) => new Date(b.created_at) -new Date(a.created_at))
    .slice(0,5);

    // data calculation ( calculate total stars using reduce() )

    const totalStars = reposData.reduce((acc,repo) =>  acc +repo.stargazers_count,0);

    return { profile:userData,repos:topRepos,totalStars};
}

// card html template generator

function createProfileCardHTML(data,battleStatus= null){
    const p = data.profile;

    const repoLinksHTML = data.repos.map(repo => `
        <li><a href ="${repo.html_url}" target="_blank">📦 ${repo.name}</a></li>
        `).join('');

    // conditional styling setup

    let cardClass = 'profile-card';
    let badgeHTML = '';

    if(battleStatus === 'winner'){
        cardClass += ' card-winner';
        badgeHTML = `<span class ="badge badge-winner">🏆 Winner (${data.totalStars} ⭐)</span>`;

    }else if(battleStatus ==='loser'){
        cardClass += ' card-loser';
        badgeHTML = `<span class="badge badge-loser">😔 Loser(${data.totalStars} ⭐)</span>`;

    }else if(battleStatus ==='tie'){
        cardClass += ' card-winner';
        badgeHTML = `<span class = "badge badge-winner">🤝 Tie (${data.totalStars} ⭐)</span>`;
    }

    // data rendering to DOM

    return `
    <div class ="${cardClass}">
    ${badgeHTML}
    <img src = "${p.avatar_url}" alt="Avatar" class="avatar">
    <h2>${p.name || p.login}</h2>
    <p style="color: #8b949e; font-size:0.9rem; margin:5px 0;">@${p.login}</p>
    <p style="margin: 10px 0;">${p.bio || '📋 This profile has no bio.'}</p>
    <p style="margin:10px 0"><strong>📆 Joined:</strong> ${formDate(p.created_at)}</p>
    <p><strong>🌐 Portfolio:</strong> ${p.blog ? `<a href="${p.blog.startsWith('http') ? p.blog : 'https://' + p.blog}" target="_blank" style="color:#58a6ff;">Link</a>`:'N/A'}</p>
    
    <h3 style="margin-top:15px; font-size:18px; border-bottom:2px solid #30363d; padding-bottom:8px;">🚀 Latest Top 5 Repos 👇</h3>
    <ul class="repo-list">
    ${repoLinksHTML || '<li>🙅 No repositories found.</li>'}
    </ul>
    </div>
    `;

}

// handling single search action 

async function handleSingleSearch(){
    const username = searchInput.value.trim();
    if(username ===""){
        errorDiv.textContent="⚠️ Please Enter username !";
        errorDiv.classList.remove('hidden');
    }
    if(!username) return;

    resetUI();

    loadingDiv.classList.remove('hidden');   // show loading spinner

    try{
        const data = await getUserData(username);
        resultContainer.innerHTML =createProfileCardHTML(data);
    }catch(err){
        // error handling 

        errorDiv.textContent = err.message === 'User Not Found' ? ' ⚠️ User Not Found' :' ⚠️ Something Went Wrong';
        errorDiv.classList.remove('hidden');
    }finally{
        loadingDiv.classList.add('hidden');  // hide loading spinner
    }
}

// handling battle mode action

async function handleBattle(){
    const user1 = user1Input.value.trim();
    const user2 = user2Input.value.trim();

    if(user1 ==="" && user2 ===""){
        errorDiv.textContent="⚠️ Please Enter both username !";
        errorDiv.classList.remove('hidden');
        return;
    }else if(user1===""){
        errorDiv.textContent="⚠️ Please Enter first username!"
        errorDiv.classList.remove('hidden');

    }else{
        errorDiv.textContent="⚠️ Please Enter second username!"
        errorDiv.classList.remove('hidden');
    }
    

    if(!user1 || !user2) return;

    resetUI()
    loadingDiv.classList.remove('hidden');

    try{
        // parallel queries execution via Promise.all()

        const [data1,data2] =await Promise.all([getUserData(user1),getUserData(user2)]);

        // logic to determine winner and loser based on totalStars

        let status1 = null;
        let status2 = null;

        if(data1.totalStars > data2.totalStars){
            status1 = 'winner';
            status2 = 'loser';
        }else if(data2.totalStars >
            data1.totalStars){
                status1 = 'loser';
                status2 = 'winner';
            }else{
                status1 = 'tie';
                status2 = 'tie';

            }

            // rendering conditional UI Cards Side by side

            resultContainer.innerHTML=`${createProfileCardHTML(data1,status1)}
            ${createProfileCardHTML(data2,status2)}`;
        
    }catch(err){
        errorDiv.textContent = 'One or both GitHub users not found.';
        errorDiv.classList.remove('hidden');
    }finally{
        loadingDiv.classList.add('hidden');
    }
}









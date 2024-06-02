
const BASE_url = 'https://film-vxzec2b7pa-et.a.run.app';


// run after loading page
window.addEventListener("DOMContentLoaded", (ev)=>{
    if (!localStorage.getItem('statusLogin')) {
      swal({
        title: "Belum Login",
        text: "Silahkan login terlebih dahulu",
        icon: "warning",
        button: "OK",
      }).then(() => {
        window.location.href = 'login.html';
      });
      return; 
    }
    const namaElement = document.getElementById("nama");
    const nama = localStorage.getItem("nama");

    if (nama.length > 10) {
        const namaPendek = nama.substring(0, 10) + "...";
        namaElement.textContent = namaPendek;
    }else{
        namaElement.textContent = nama;
    setGenres();
    
    //  set arrow movement for categories
    const rightArrow = document.querySelector(".scrollable-tabs-container .right-arrow svg");
    const leftArrow = document.querySelector(".scrollable-tabs-container .left-arrow svg");
    const tagsEl = document.getElementById('tags');

    rightArrow.addEventListener("click", ()=>{
        tagsEl.scrollLeft += 500;
        manageIcons();
    });
    leftArrow.addEventListener("click", ()=>{
        tagsEl.scrollLeft -= 500;
        manageIcons();
    });

    LoadMovie();

    
    let searchBar = document.querySelector('.search');


})

const logout = document.querySelector("#logout");
logout.addEventListener("click", ()=>{
  localStorage.removeItem('statusLogin');
  localStorage.removeItem('id_user');
  localStorage.removeItem('nama');
  swal({
    title: "Logout Berhasil",
    text: "Anda telah berhasil logout!",
    icon: "success",
    button: "OK",
  }).then(() => {
      window.location.href = 'login.html';
  });

})

const formulir = document.querySelector("#formulir");

formulir.addEventListener("submit", (e) => {
  e.preventDefault();
  tambahOrEdit();
});

function tambahOrEdit(){
  const judul = document.getElementById("judul").value;
  const id_film = document.getElementById("judul").dataset.id;
  const poster = document.getElementById("poster").files[0];
  const tahun_rilis = document.getElementById("tahun_rilis").value;
  const genre = document.getElementById("genre").value;
  const rating = document.getElementById("rating").value;
  const direktor = document.getElementById("direktor").value;
  const plot = document.getElementById("plot").value;

  if (id_film == "") {
    // Tambah catatan
    axios
      .post(`${BASE_url}/film`, {
        judul,
        poster,
        tahun_rilis,
        genre,
        rating,
        direktor,
        plot,
      }, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    )
      .then(() => {
        bersihinForm();
        swal({
          icon: 'success',
          title: 'Sukses!',
          text: 'Film berhasil ditambahkan.',
          button: "OK"
        }).then(() => {
          closeNav();
        });
        LoadMovie();
        setGenres();
      })
      .catch((error) => console.log(error));
  } else {
    axios
      .put(`${BASE_url}/film/${id_film}`, {
        judul,
        poster,
        tahun_rilis,
        genre,
        rating,
        direktor,
        plot,
      },{
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then(() => {
        bersihinForm();
        swal({
          icon: 'success',
          title: 'Sukses!',
          text: 'Film berhasil diedit.',
          button: "OK"
        }).then(() => {
          closeNav();
        });
        LoadMovie();
        setGenres();
      })
      .catch((error) => console.log(error));
  }
}

function bersihinForm(){
  const gambarPoster = document.getElementById("gambar-poster");
  gambarPoster.src = "";
  gambarPoster.style.display = "none";
  const judul = document.getElementById("judul").value = "";
  const id_film = document.getElementById("judul").dataset.id = "";
  const poster = document.getElementById("poster").value = "";
  const tahun_rilis = document.getElementById("tahun_rilis").value = "";
  const genre = document.getElementById("genre").value = "";
  const rating = document.getElementById("rating").value = "";
  const direktor = document.getElementById("direktor").value = "";
  const plot = document.getElementById("plot").value = "";
}

function topFunction() {
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}

function setGenres(){
    
    let genres = []
    // console.log(tags_el);
    axios
    .get(BASE_url + "/film/genres")
    .then(({ data }) => {
      const { data: genres_data } = data;
      genres = genres_data;
      loadGenres(genres);
    })
    .catch((error) => {
      console.log(error.message);
    });

    
}

function loadGenres(genres) {
  let tags_el = document.querySelector('#tags');
  let tags =  document.querySelectorAll('.tag')
  tags.forEach(tag => {
    tag.remove();
  });
  genres.forEach(genre =>{
    const t = document.createElement('div');
    t.classList.add('tag');
    t.innerText = genre;
    
    t.addEventListener('click', () => {
        selectedGenre = t.textContent
          console.log(selectedGenre)
        
        // let newurl = API_url + '&with_genres=' + encodeURI(selectedGenre.join(','));
        // let whichPage = localStorage.getItem('page');
        t.classList.toggle("active");
        if(t.classList.contains("active")){

          LoadMovie(selectedGenre);
        }else{
          LoadMovie();
        }
        
        highlightSelection();

    })

    tags_el.append(t);
  })
}

// manange the left and right arrows for genre categories
const manageIcons = ()=>{
    const tagsEl = document.getElementById('tags');
    const leftArrowContainer = document.querySelector(".scrollable-tabs-container .left-arrow")
    const rightArrowContainer = document.querySelector(".scrollable-tabs-container .right-arrow")

    if(tagsEl.scrollLeft >= 20){
        leftArrowContainer.classList.add("active")
    }else{
        leftArrowContainer.classList.remove("active")
    }
    let maxScrollValue = tagsEl.scrollWidth - tagsEl.clientWidth - 20;
    // console.log(tagsEl.scrollWidth);
    // console.log(tagsEl.clientWidth);

    if(tagsEl.scrollLeft >= maxScrollValue){
        rightArrowContainer.classList.remove("active")

    }else{
        rightArrowContainer.classList.add("active");
    }
}

//highlighting the selected genre.
function removeActive(){
    const tags = document.querySelectorAll('.tag');
    tags.forEach(tag =>{
      tag.classList.remove('active')
    })
}

// Asynchronous function which loads data from API 
function LoadMovie(genre = "semua"){
  let api_url;
    if(genre == "semua"){
      api_url = BASE_url + "/film";
    }else{
      api_url = BASE_url + "/film/genre/" + genre;
    }
    axios
    .get(api_url)
    .then(({ data }) => {
      const { data: films } = data;

      console.log(films);
      if(films.length == 0){
        if(data.results.length == 0){
          main.innerHTML = `
          <h1 style = "color: white;"> WOW! SUCH EMPTY 🙂 </h1>
          `   
        }
      }else{
        tampilkanFilm(films);
      }
      
    })
    .catch((error) => {
      console.log(error.message);
    });
}


function tampilkanFilm(data){
    let main = document.querySelector('#main');

    main.innerHTML=' ';
    
    data.forEach( movie => {
      const {judul, poster, plot, tahun_rilis, id_film, direktor, genre, rating} = movie;
        // let rating = 9.0;
        const movieEl = document.createElement('div');
        movieEl.classList.add('movie');

        movieEl.innerHTML =  `
        <div>
        <span class="releaseDate"> ${tahun_rilis} </span>
        <img src="${poster}" alt="${judul}">
        
        </div>
        <div class="movie-info">
        <h3>${judul}</h3>
      <span class="${getColor(rating)}">${rating}</span>
        </div>
        <div class="overview">
        <span>
      <h3>${judul}</h3>
      <span class="overview-content">
      ${plot}
      </span>
      <br>
      <button class="knowmore" id="${id_film}" onclick=tampilPopupDetail(${id_film})>Detail</button>
      <button class="edit btn-edit" id="${id_film}" onclick=tampilPopupForm(${id_film})>Edit</button>
      <button class="delete" id="${id_film}" onclick=hapusFilm(${id_film})>Delete</button>
      </span>
    </div>
    `
    main.appendChild(movieEl)
    console.log(`datacutt:`);
    document.getElementById(id_film).addEventListener('click', ()=>{
        // console.log(id);
        // openNav(movie);
    })
    })
}

function hapusFilm(id_film) {
  swal({
    title: 'Yakin?',
    text: "Anda tidak akan dapat mengembalikan ini!",
    icon: 'warning',
    showCancelButton: true,
    buttons: true,
    dangerMode: true
  }).then((result) => {
    if(result){
      axios
        .delete(`${BASE_url}/film/${id_film}`)
        .then(() => {
          LoadMovie();
          setGenres();
         })
        .catch((error) => console.log(error));
    }
  })
  
}
//change the class of vote_average based on the rating to show different colors for different ratings.
function getColor(vote){
    if(vote >= 7){
      return 'green'  
    }
    else if(vote >= 5){
      return 'orange'
    }
    else{
      return 'red'
    }
}

function tampilPopupForm(id_film = null) {
  const btnForm = document.querySelector("#btn-form");
  if(id_film != null){
    btnForm.innerText = "Edit Film";
  
    axios
    .get(`${BASE_url}/film/${id_film}`)
    .then(({ data }) => {
      const { data: film } = data;

      const gambarPoster = document.getElementById("gambar-poster");
      gambarPoster.src = film.poster
      gambarPoster.style.display = "block";

      document.getElementById("judul").value = film.judul;
      document.getElementById("judul").dataset.id = film.id_film;
      // const poster = document.getElementById("poster").value = film.poster;
      document.getElementById("tahun_rilis").value = film.tahun_rilis;
      document.getElementById("genre").value = film.genre;
      document.getElementById("rating").value = film.rating;
      document.getElementById("direktor").value = film.direktor;
      document.getElementById("plot").value = film.plot;
      
      
    })
    .catch((error) => {
      console.log(error.message);
    });

  }else{
    btnForm.innerText = "Tambah Film";
  }

  const overlayContent = document.getElementById('overlay-content');
  document.getElementById("popup-form").style.width = "100%";

  
}

function tampilPopupDetail(id_film) {
  
    axios
    .get(`${BASE_url}/film/${id_film}`)
    .then(({ data }) => {
      const { data: film } = data;

      const gambarPoster = document.getElementById("gambar-poster-film");
      gambarPoster.src = film.poster
      gambarPoster.style.display = "block";

      document.getElementById("judul-film").innerText = film.judul;
      document.getElementById("tahun_rilis-film").innerText = film.tahun_rilis;
      document.getElementById("genre-film").innerText = film.genre;
      document.getElementById("rating-film").innerText = film.rating;
      document.getElementById("direktor-film").innerText = film.direktor;
      document.getElementById("plot-film").innerText = film.plot;
      
      
    })
    .catch((error) => {
      console.log(error.message);
    });

 
  const overlayContent = document.getElementById('overlay-content');
  document.getElementById("popup-detail").style.width = "100%";

  
}


function closeNav() {
    bersihinForm()
    const overlay = document.getElementById("popup-form");
    overlay.style.width = "0%";
}

function closeNavDetails() {
  bersihinForm()
  const overlay = document.getElementById("popup-detail");
  overlay.style.width = "0%";
}


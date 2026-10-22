/**
 * Real works used as the subject of the seeded reviews.
 *
 * The database has no separate `works` table: a review stores its own title and
 * the type/genre. These records supply the real-world reference so the seed
 * reads like a community discussing actual books, films, albums, series and
 * games instead of filler titles.
 *
 * Each type/genre pair has ten works; every work receives twenty reviews.
 */
export const WORKS = [];

function add(type, genre, entries) {
  for (const [title, creator, year] of entries) {
    WORKS.push({ title, creator, year, type, genre });
  }
}

add('Book', 'Action', [
  ['O Senhor dos Anéis', 'J. R. R. Tolkien', 1954],
  ['Duna', 'Frank Herbert', 1965],
  ['O Hobbit', 'J. R. R. Tolkien', 1937],
  ['Neuromancer', 'William Gibson', 1984],
  ['O Problema dos Três Corpos', 'Liu Cixin', 2008],
  ['A Estrada', 'Cormac McCarthy', 2006],
  ['Vinte Mil Léguas Submarinas', 'Júlio Verne', 1870],
  ['A Ilha do Tesouro', 'Robert Louis Stevenson', 1883],
  ['O Nome do Vento', 'Patrick Rothfuss', 2007],
  ['Ensaio sobre a Cegueira', 'José Saramago', 1995],
]);

add('Book', 'Romance', [
  ['Orgulho e Preconceito', 'Jane Austen', 1813],
  ['Jane Eyre', 'Charlotte Brontë', 1847],
  ['O Morro dos Ventos Uivantes', 'Emily Brontë', 1847],
  ['Dom Casmurro', 'Machado de Assis', 1899],
  ['A Moreninha', 'Joaquim Manuel de Macedo', 1844],
  ['Como Água para Chocolate', 'Laura Esquivel', 1989],
  ['O Amor nos Tempos do Cólera', 'Gabriel García Márquez', 1985],
  ['Um Dia', 'David Nicholls', 2009],
  ['A Culpa é das Estrelas', 'John Green', 2012],
  ['O Diário de Bridget Jones', 'Helen Fielding', 1996],
]);

add('Book', 'Horror', [
  ['Drácula', 'Bram Stoker', 1897],
  ['Frankenstein', 'Mary Shelley', 1818],
  ['O Iluminado', 'Stephen King', 1977],
  ['It: A Coisa', 'Stephen King', 1986],
  ['O Exorcista', 'William Peter Blatty', 1971],
  ['A Assombração da Casa da Colina', 'Shirley Jackson', 1959],
  ['O Chamado de Cthulhu', 'H. P. Lovecraft', 1928],
  ['Entrevista com o Vampiro', 'Anne Rice', 1976],
  ['Misery', 'Stephen King', 1987],
  ['Coraline', 'Neil Gaiman', 2002],
]);

add('Book', 'Comedy', [
  ['O Guia do Mochileiro das Galáxias', 'Douglas Adams', 1979],
  ['Catch-22', 'Joseph Heller', 1961],
  ['Triste Fim de Policarpo Quaresma', 'Lima Barreto', 1915],
  ['Memórias Póstumas de Brás Cubas', 'Machado de Assis', 1881],
  ['O Auto da Compadecida', 'Ariano Suassuna', 1955],
  ['A Comédia dos Erros', 'William Shakespeare', 1595],
  ['O Homem que Calculava', 'Malba Tahan', 1938],
  ['O Diário de um Banana', 'Jeff Kinney', 2007],
  ['Alice no País das Maravilhas', 'Lewis Carroll', 1865],
  ['O Sítio do Picapau Amarelo', 'Monteiro Lobato', 1920],
]);

add('Book', 'Drama', [
  ['A Revolução dos Bichos', 'George Orwell', 1945],
  ['1984', 'George Orwell', 1949],
  ['Crime e Castigo', 'Fiódor Dostoiévski', 1866],
  ['O Grande Gatsby', 'F. Scott Fitzgerald', 1925],
  ['A Metamorfose', 'Franz Kafka', 1915],
  ['Grande Sertão: Veredas', 'João Guimarães Rosa', 1956],
  ['Vidas Secas', 'Graciliano Ramos', 1938],
  ['A Hora da Estrela', 'Clarice Lispector', 1977],
  ['O Estrangeiro', 'Albert Camus', 1942],
  ['Cem Anos de Solidão', 'Gabriel García Márquez', 1967],
]);

add('Movie', 'Action', [
  ['Mad Max: Estrada da Fúria', 'George Miller', 2015],
  ['O Império Contra-Ataca', 'Irvin Kershner', 1980],
  ['Matrix', 'Lana e Lilly Wachowski', 1999],
  ['Blade Runner 2049', 'Denis Villeneuve', 2017],
  ['Gladiador', 'Ridley Scott', 2000],
  ['Missão: Impossível – Efeito Fallout', 'Christopher McQuarrie', 2018],
  ['John Wick', 'Chad Stahelski', 2014],
  ['Top Gun: Maverick', 'Joseph Kosinski', 2022],
  ['O Cavaleiro das Trevas', 'Christopher Nolan', 2008],
  ['Parasita', 'Bong Joon-ho', 2019],
]);

add('Movie', 'Romance', [
  ['Antes do Amanhecer', 'Richard Linklater', 1995],
  ['Simplesmente Amor', 'Richard Curtis', 2003],
  ['Diário de uma Paixão', 'Nick Cassavetes', 2004],
  ['Questão de Tempo', 'Richard Curtis', 2013],
  ['La La Land: Cantando Estações', 'Damien Chazelle', 2016],
  ['O Fabuloso Destino de Amélie Poulain', 'Jean-Pierre Jeunet', 2001],
  ['E o Vento Levou', 'Victor Fleming', 1939],
  ['Orgulho e Preconceito', 'Joe Wright', 2005],
  ['Me Chame pelo Seu Nome', 'Luca Guadagnino', 2017],
  ['O Amor Não Tira Férias', 'Nancy Meyers', 2006],
]);

add('Movie', 'Horror', [
  ['O Iluminado', 'Stanley Kubrick', 1980],
  ['Hereditário', 'Ari Aster', 2018],
  ['O Exorcista', 'William Friedkin', 1973],
  ['Psicose', 'Alfred Hitchcock', 1960],
  ['Corra!', 'Jordan Peele', 2017],
  ['A Bruxa', 'Robert Eggers', 2015],
  ['O Babadook', 'Jennifer Kent', 2014],
  ['Alien: O Oitavo Passageiro', 'Ridley Scott', 1979],
  ['A Noite dos Mortos-Vivos', 'George A. Romero', 1968],
  ['O Sexto Sentido', 'M. Night Shyamalan', 1999],
]);

add('Movie', 'Comedy', [
  ['O Grande Lebowski', 'Joel e Ethan Coen', 1998],
  ['Monty Python e o Cálice Sagrado', 'Terry Gilliam e Terry Jones', 1975],
  ['Debi & Lóide', 'Peter Farrelly', 1994],
  ['As Branquelas', 'Keenen Ivory Wayans', 2004],
  ['A Vida de Brian', 'Terry Jones', 1979],
  ['Apertem os Cintos... O Piloto Sumiu!', 'Jim Abrahams, David Zucker e Jerry Zucker', 1980],
  ['O Auto da Compadecida', 'Guel Arraes', 2000],
  ['Minha Mãe é uma Peça', 'André Pellenz', 2013],
  ['O Ditador', 'Larry Charles', 2012],
  ['Tá Dando Onda', 'Ash Brannon e Chris Buck', 2007],
]);

add('Movie', 'Drama', [
  ['Cidade de Deus', 'Fernando Meirelles e Kátia Lund', 2002],
  ['Central do Brasil', 'Walter Salles', 1998],
  ['O Poderoso Chefão', 'Francis Ford Coppola', 1972],
  ['Cidadão Kane', 'Orson Welles', 1941],
  ['Um Sonho de Liberdade', 'Frank Darabont', 1994],
  ['Forrest Gump: O Contador de Histórias', 'Robert Zemeckis', 1994],
  ['Clube da Luta', 'David Fincher', 1999],
  ['Luzes da Cidade', 'Charlie Chaplin', 1931],
  ['O Sétimo Selo', 'Ingmar Bergman', 1957],
  ['Ainda Estou Aqui', 'Walter Salles', 2024],
]);

add('Album', 'Action', [
  ['Nevermind', 'Nirvana', 1991],
  ['Back in Black', 'AC/DC', 1980],
  ['Master of Puppets', 'Metallica', 1986],
  ['London Calling', 'The Clash', 1979],
  ['Appetite for Destruction', "Guns N' Roses", 1987],
  ['Ten', 'Pearl Jam', 1991],
  ['Hybrid Theory', 'Linkin Park', 2000],
  ['Roots', 'Sepultura', 1996],
  ['The Downward Spiral', 'Nine Inch Nails', 1994],
  ['Rage Against the Machine', 'Rage Against the Machine', 1992],
]);

add('Album', 'Romance', [
  ['Rumours', 'Fleetwood Mac', 1977],
  ['Blue', 'Joni Mitchell', 1971],
  ['21', 'Adele', 2011],
  ['Back to Black', 'Amy Winehouse', 2006],
  ['Diamond Life', 'Sade', 1984],
  ['The Miseducation of Lauryn Hill', 'Lauryn Hill', 1998],
  ['Acústico MTV', 'Cássia Eller', 2001],
  ['O Amor, o Sorriso e a Flor', 'João Gilberto', 1960],
  ['The Bodyguard', 'Whitney Houston', 1992],
  ['A Day Without Rain', 'Enya', 2000],
]);

add('Album', 'Horror', [
  ['Pornography', 'The Cure', 1982],
  ['Disintegration', 'The Cure', 1989],
  ['Mezzanine', 'Massive Attack', 1998],
  ['Kid A', 'Radiohead', 2000],
  ['Black Sabbath', 'Black Sabbath', 1970],
  ['Songs of Faith and Devotion', 'Depeche Mode', 1993],
  ['Homogenic', 'Björk', 1997],
  ['Dead Magic', 'Anna von Hausswolff', 2018],
  ['The Wall', 'Pink Floyd', 1979],
  ['Closer', 'Joy Division', 1980],
]);

add('Album', 'Comedy', [
  ['Class Clown', 'George Carlin', 1972],
  ['Hilarious', 'Louis C.K.', 2011],
  ["Killin' Them Softly", 'Dave Chappelle', 2000],
  ['Mandatory Fun', '"Weird Al" Yankovic', 2014],
  ['Incredibad', 'The Lonely Island', 2009],
  ['Flight of the Conchords', 'Flight of the Conchords', 2008],
  ['Mamonas Assassinas', 'Mamonas Assassinas', 1995],
  ['Live at the Purple Onion', 'Zach Galifianakis', 2006],
  ['What.', 'Bo Burnham', 2013],
  ['Inside', 'Bo Burnham', 2021],
]);

add('Album', 'Drama', [
  ['OK Computer', 'Radiohead', 1997],
  ['To Pimp a Butterfly', 'Kendrick Lamar', 2015],
  ['Illmatic', 'Nas', 1994],
  ['Construção', 'Chico Buarque', 1971],
  ['Clube da Esquina', 'Milton Nascimento e Lô Borges', 1972],
  ['Acabou Chorare', 'Novos Baianos', 1972],
  ['Transa', 'Caetano Veloso', 1972],
  ['Sobrevivendo no Inferno', "Racionais MC's", 1997],
  ['The Dark Side of the Moon', 'Pink Floyd', 1973],
  ['Abbey Road', 'The Beatles', 1969],
]);

add('Series', 'Action', [
  ['Breaking Bad', 'Vince Gilligan', 2008],
  ['The Wire', 'David Simon', 2002],
  ['Game of Thrones', 'David Benioff e D. B. Weiss', 2011],
  ['The Expanse', 'Mark Fergus e Hawk Ostby', 2015],
  ['Battlestar Galactica', 'Ronald D. Moore', 2004],
  ['The Boys', 'Eric Kripke', 2019],
  ['Peaky Blinders', 'Steven Knight', 2013],
  ['Narcos', 'Chris Brancato, Carlo Bernard e Doug Miro', 2015],
  ['Chernobyl', 'Craig Mazin', 2019],
  ['Primal', 'Genndy Tartakovsky', 2019],
]);

add('Series', 'Romance', [
  ['Normal People', 'Sally Rooney e Alice Birch', 2020],
  ['Bridgerton', 'Chris Van Dusen', 2020],
  ['Downton Abbey', 'Julian Fellowes', 2010],
  ['Outlander', 'Ronald D. Moore', 2014],
  ['Sex and the City', 'Darren Star', 1998],
  ['Gilmore Girls', 'Amy Sherman-Palladino', 2000],
  ['Jane the Virgin', 'Jennie Snyder Urman', 2014],
  ['Felicity', 'J. J. Abrams e Matt Reeves', 1998],
  ['Love', 'Judd Apatow, Paul Rust e Lesley Arfin', 2016],
  ['Starstruck', 'Rose Matafeo', 2021],
]);

add('Series', 'Horror', [
  ['Twin Peaks', 'David Lynch e Mark Frost', 1990],
  ['A Maldição da Residência Hill', 'Mike Flanagan', 2018],
  ['Missa da Meia-Noite', 'Mike Flanagan', 2021],
  ['American Horror Story', 'Ryan Murphy e Brad Falchuk', 2011],
  ['Stranger Things', 'The Duffer Brothers', 2016],
  ['Dark', 'Baran bo Odar e Jantje Friese', 2017],
  ['Hannibal', 'Bryan Fuller', 2013],
  ['Penny Dreadful', 'John Logan', 2014],
  ['Arquivo X', 'Chris Carter', 1993],
  ['Bates Motel', 'Carlton Cuse, Kerry Ehrin e Anthony Cipriano', 2013],
]);

add('Series', 'Comedy', [
  ['Seinfeld', 'Larry David e Jerry Seinfeld', 1989],
  ['Friends', 'David Crane e Marta Kauffman', 1994],
  ['The Office', 'Greg Daniels', 2005],
  ['Arrested Development', 'Mitchell Hurwitz', 2003],
  ['Parks and Recreation', 'Greg Daniels e Michael Schur', 2009],
  ['Fleabag', 'Phoebe Waller-Bridge', 2016],
  ['Brooklyn Nine-Nine', 'Dan Goor e Michael Schur', 2013],
  ['Community', 'Dan Harmon', 2009],
  ['The Good Place', 'Michael Schur', 2016],
  ['30 Rock', 'Tina Fey', 2006],
]);

add('Series', 'Drama', [
  ['The Sopranos', 'David Chase', 1999],
  ['Mad Men', 'Matthew Weiner', 2007],
  ['Succession', 'Jesse Armstrong', 2018],
  ['A Sete Palmos', 'Alan Ball', 2001],
  ['The Leftovers', 'Damon Lindelof e Tom Perrotta', 2014],
  ['Better Call Saul', 'Vince Gilligan e Peter Gould', 2015],
  ['BoJack Horseman', 'Raphael Bob-Waksberg', 2014],
  ['This Is Us', 'Dan Fogelman', 2016],
  ['The Crown', 'Peter Morgan', 2016],
  ['Euphoria', 'Sam Levinson', 2019],
]);

add('Game', 'Action', [
  ['The Legend of Zelda: Breath of the Wild', 'Nintendo EPD', 2017],
  ['Red Dead Redemption 2', 'Rockstar Games', 2018],
  ['God of War', 'Santa Monica Studio', 2018],
  ['Elden Ring', 'FromSoftware', 2022],
  ['Doom Eternal', 'id Software', 2020],
  ['Hades', 'Supergiant Games', 2020],
  ['Hollow Knight', 'Team Cherry', 2017],
  ['Sekiro: Shadows Die Twice', 'FromSoftware', 2019],
  ['Bloodborne', 'FromSoftware', 2015],
  ['Cuphead', 'Studio MDHR', 2017],
]);

add('Game', 'Romance', [
  ['Life is Strange', 'Dontnod Entertainment', 2015],
  ['To the Moon', 'Freebird Games', 2011],
  ['Stardew Valley', 'ConcernedApe', 2016],
  ['Firewatch', 'Campo Santo', 2016],
  ['Haven', 'The Game Bakers', 2020],
  ['Dream Daddy: A Dad Dating Simulator', 'Game Grumps', 2017],
  ['Florence', 'Mountains', 2018],
  ['Mass Effect 2', 'BioWare', 2010],
  ['Persona 5 Royal', 'Atlus', 2019],
  ['The Sims 4', 'Maxis', 2014],
]);

add('Game', 'Horror', [
  ['Silent Hill 2', 'Team Silent', 2001],
  ['Resident Evil 4', 'Capcom', 2005],
  ['Dead Space', 'EA Redwood Shores', 2008],
  ['Amnesia: The Dark Descent', 'Frictional Games', 2010],
  ['Outlast', 'Red Barrels', 2013],
  ['Alien: Isolation', 'Creative Assembly', 2014],
  ['Layers of Fear', 'Bloober Team', 2016],
  ['Phasmophobia', 'Kinetic Games', 2020],
  ['Fatal Frame II: Crimson Butterfly', 'Tecmo', 2003],
  ['SOMA', 'Frictional Games', 2015],
]);

add('Game', 'Comedy', [
  ['Portal 2', 'Valve', 2011],
  ['Undertale', 'Toby Fox', 2015],
  ['The Stanley Parable', 'Galactic Cafe', 2013],
  ['Psychonauts', 'Double Fine', 2005],
  ['Day of the Tentacle', 'LucasArts', 1993],
  ['The Secret of Monkey Island', 'LucasArts', 1990],
  ['Saints Row: The Third', 'Volition', 2011],
  ['Goat Simulator', 'Coffee Stain Studios', 2014],
  ['Untitled Goose Game', 'House House', 2019],
  ['South Park: The Stick of Truth', 'Obsidian Entertainment', 2014],
]);

add('Game', 'Drama', [
  ['The Last of Us', 'Naughty Dog', 2013],
  ['What Remains of Edith Finch', 'Giant Sparrow', 2017],
  ['Disco Elysium', 'ZA/UM', 2019],
  ['Red Dead Redemption', 'Rockstar San Diego', 2010],
  ['Death Stranding', 'Kojima Productions', 2019],
  ['Nier: Automata', 'PlatinumGames', 2017],
  ['Celeste', 'Maddy Makes Games', 2018],
  ['Journey', 'Thatgamecompany', 2012],
  ['Gris', 'Nomada Studio', 2018],
  ['A Plague Tale: Innocence', 'Asobo Studio', 2019],
]);

if (WORKS.length !== 250) {
  throw new Error(`Expected 250 works, got ${WORKS.length}`);
}

const gameboard = document.querySelector("#gameboard")
const playerdisplay = document.querySelector("#player")
const infordisplay = document.querySelector("#info-display")
const width = 8
let playergo = 'white'
playerdisplay.textContent = 'white'

const startpieces = [
    rook, knight, bishop, queen, king, bishop, knight, rook,
    pawn, pawn, pawn, pawn, pawn, pawn, pawn, pawn,
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    pawn, pawn, pawn, pawn, pawn, pawn, pawn, pawn,
    rook, knight, bishop, queen, king, bishop, knight, rook,
]

function createGameBoard(){
    startpieces.forEach((startpieces, i) => {
        const square = document.createElement('div')
        square.classList.add('square')
        square.innerHTML = startpieces
        square.firstChild && square.firstChild.setAttribute('draggable', true)
        square.setAttribute('square-id', i)
        const row = Math.floor((63 - i) / 8) + 1
        if (row % 2 === 0){
            square.classList.add(i % 2 === 0 ? "beige" : "brown")
        } else {
            square.classList.add(i % 2 === 0 ? "brown" : "beige")
        }

        if (i <= 15){
            square.firstChild.firstChild.classList.add('black')
        }

        if(i >= 48){
            square.firstChild.firstChild.classList.add('white')
        }

        gameboard.append(square)
    })
}

createGameBoard()
reverseIds()


const allsquares = document.querySelectorAll("#gameboard .square")

allsquares.forEach(square => {
    square.addEventListener('dragstart', dragStart)
    square.addEventListener('dragover', dragOver)
    square.addEventListener('drop', dragDrop)
})

let startpositionId
let draggedElement

function dragStart(e){
   startpositionId = e.target.parentNode.getAttribute('square-id')
   draggedElement = e.target
}

function dragOver(e){
    e.preventDefault()
}


function dragDrop(e){
    e.stopPropagation()
    const correctGo = draggedElement.firstChild.classList.contains(playergo)
    const taken = e.target.classList.contains('piece')
    const valid = checkIfVallid(e.target)
    console.log(e.target)
    const opponentGo = playergo === 'black' ? 'white' : 'black'
    const takenByOpponent = e.target.firstChild?.classList.contains(opponentGo)

    if(correctGo){
        if(takenByOpponent && valid){
            e.target.parentNode.append(draggedElement)
            e.target.remove()
            changePlayer()
            return
        }
        if(taken &&! takenByOpponent){
            infordisplay.textContent = 'you cannot go there mf'
            setTimeout(()=>infordisplay.textContent = '', 200)
            return
        }
        if (valid){
            e.target.append(draggedElement)
            changePlayer()
            return
        }
    }
   
}

function changePlayer(){
    if(playergo === 'black'){
        playergo = 'white'
        playerdisplay.textContent = 'white'
        reverseIds()
    } else {
        revertIds()
        playergo = 'black'
        playerdisplay.textContent = 'black'
    }
}

function reverseIds(){
    const allsquares = document.querySelectorAll(".square")
    allsquares.forEach((square, i) => square.setAttribute('square-id', (width * width -1) - i))
}

function revertIds(){
    const allsquares = document.querySelectorAll(".square")
    allsquares.forEach((square, i) => square.setAttribute('square-id', i))
}

function checkIfVallid(target){
    const targetId = Number(target.getAttribute('square-id')) || Number(target.parentNode.getAttribute('square-id'))
    const startId = Number(startpositionId)
    const piece = draggedElement.id

    switch(piece){
        case 'pawn': 
            // Determine if the pawn is on its starting row
            const startingRows = [8, 9, 10, 11, 12, 13, 14, 15]; // Starting rows for pawns
            const isPawnStartingRow = startingRows.includes(startId);

            // Forward movement - one square
            if (startId + width === targetId && !document.querySelector(`[square-id="${targetId}"]`).firstChild) {
                return true;
            }
            // Initial two-square move
            if (isPawnStartingRow && startId + 2 * width === targetId &&
                !document.querySelector(`[square-id="${targetId}"]`).firstChild &&
                !document.querySelector(`[square-id="${startId + width}"]`).firstChild) {
                return true;
            }
            // Diagonal capture
            const diagonalTargets = [startId + width - 1, startId + width + 1];
            for (let i = 0; i < diagonalTargets.length; i++) {
                const diagTargetId = diagonalTargets[i];
                const targetSquare = document.querySelector(`[square-id="${diagTargetId}"]`);
                if (diagTargetId === targetId && targetSquare && targetSquare.firstChild) {
                    return true;
                }
            }
    break;
        case 'knight':
            const possibleMoves = [
                startId - width * 2 - 1, startId - width * 2 + 1,
                startId + width * 2 - 1, startId + width * 2 + 1,
                startId - width - 2, startId - width + 2,         
                startId + width - 2, startId + width + 2          
            ];
        
            const validMoves = possibleMoves.filter(move => {
                const rowDifference = Math.floor(move / width) - Math.floor(startId / width);
                return move >= 0 && move < width * width && Math.abs(rowDifference) <= 2;
            });
        
            if (validMoves.includes(targetId)) {
                return true;
            }
        case 'queen':
            const directionsQueen = [
                -1, 1, // Left, right
                -width, width, // Up, down
                -width - 1, -width + 1, // Diagonal up
                width - 1, width + 1 // Diagonal down
            ];
        
            // Check each direction
            for (let i = 0; i < directionsQueen.length; i++) {
                let move = startId;
                while (true) {  
                    move += directionsQueen[i];
                
                    // Break if the move goes off the board
                    if (move < 0 || move >= width * width) break;
                
                    // Handling to avoid wrapping around the board
                    if (Math.floor(move / width) !== Math.floor((move - directionsQueen[i]) / width) &&
                        [1, -1].includes(directionsQueen[i])) break;
                
                    // Check if the move is the target position
                    if (move === targetId) return true;
                
                    // If the move hits another piece
                    if (document.querySelector(`[square-id="${move}"]`).firstChild) break;
                }
            }
        case 'bishop':
            const directionsBishop = [
                -width - 1, -width + 1, // Diagonal up
                width - 1, width + 1 // Diagonal down
            ];
            // Check each direction
            for (let i = 0; i < directionsBishop.length; i++) {
                let move = startId;
                while (true) {  
                    move += directionsBishop[i];
                
                    // Break if the move goes off the board
                    if (move < 0 || move >= width * width) break;
                
                    // Handling to avoid wrapping around the board
                    if (Math.floor(move / width) !== Math.floor((move - directionsBishop[i]) / width) &&
                        [1, -1].includes(directionsBishop[i])) break;
                
                    // Check if the move is the target position
                    if (move === targetId) return true;
                
                    // If the move hits another piece
                    if (document.querySelector(`[square-id="${move}"]`).firstChild) break;
                }
            }
    }
}
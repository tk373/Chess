const gameboard = document.querySelector("#gameboard")
const playerdisplay = document.querySelector("#player")
const infordisplay = document.querySelector("#info-display")
const width = 8
let playergo = 'white'
playerdisplay.textContent = 'white'
let isChecked = false;

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

function createGameBoard() {
    // Add an offset div for alignment at the top left corner
    const topLeftCorner = document.createElement('div');
    topLeftCorner.classList.add('label');
    gameboard.appendChild(topLeftCorner);

    // Create the top row for letters A-H
    for (let i = 0; i < width; i++) {
        const letter = document.createElement('div');
        letter.classList.add('label');
        letter.textContent = String.fromCharCode('A'.charCodeAt(0) + i); 
        gameboard.appendChild(letter);
    }

    startpieces.forEach((piece, i) => {
        if (i % width === 0) {
            const number = document.createElement('div');
            number.classList.add('label');
            number.textContent = 8 - Math.floor(i / width); 
            gameboard.appendChild(number);
        }

        const square = document.createElement('div');
        square.classList.add('square');
        square.innerHTML = piece;
        square.firstChild && square.firstChild.setAttribute('draggable', true);
        square.setAttribute('square-id', i);
        const row = Math.floor(i / width);

        if (row % 2 === 0) {
            square.classList.add(i % 2 === 0 ? "beige" : "brown");
        } else {
            square.classList.add(i % 2 === 0 ? "brown" : "beige");
        }

        // Assign classes to black and white pieces for better identification
        if (i < 16 && square.firstChild) { // Black pieces
            square.firstChild.classList.add('black');
        }
        if (i >= 48 && square.firstChild) { // White pieces
            square.firstChild.classList.add('white');
        }

        gameboard.appendChild(square);
    });

    // Align the bottom row for characters A-H
    for (let j = 0; j <= width; j++) {
        const bottomAlign = document.createElement('div');
        bottomAlign.classList.add('label');
        if (j === 0) {
            bottomAlign.textContent = '';
        } else {
            bottomAlign.textContent = String.fromCharCode('A'.charCodeAt(0) + j - 1); // Add letters A-H again
        }
        gameboard.appendChild(bottomAlign);
    }
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
    if (!e.target.classList.contains(playergo)) {
        e.preventDefault();
    } else {
        startpositionId = e.target.parentNode.getAttribute('square-id');
        console.log("startingposition "+startpositionId);
        draggedElement = e.target;
    }
}

function dragOver(e){
    e.preventDefault()
}


function dragDrop(e){
    e.preventDefault();
    e.stopPropagation();
    const correctGo = draggedElement.classList.contains(playergo);
    const taken = e.target.classList.contains('piece');
    const valid = checkIfVallid(e.target);
    const opponentGo = playergo === 'black' ? 'white' : 'black';
    const takenByOpponent = e.target?.classList.contains(opponentGo);
    const targetSquare = e.target.classList.contains('square') ? e.target : e.target.parentNode;
    const targetId = parseInt(targetSquare.getAttribute('square-id'));

    if (draggedElement.id === 'king' && Math.abs(startpositionId - targetId) === 2) {
        performCastle(parseInt(startpositionId), targetId);
        return;
    }

    if(correctGo){

        if(takenByOpponent && valid){
            e.target.parentNode.append(draggedElement)
            e.target.remove()
            changePlayer()
            if (isKingInCheck(playergo)) {
                isChecked = true;
                infordisplay.textContent = 'Check!';
            }
            return
        }
        if(taken &&! takenByOpponent){
            return
        }
        if (valid){
            e.target.append(draggedElement)
            changePlayer()
            if (isKingInCheck(playergo)) {
                isChecked = true;
                infordisplay.textContent = 'Check!';
            }else{
                isChecked = false;
                infordisplay.textContent = '';
            }
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
            const startingRows = [8, 9, 10, 11, 12, 13, 14, 15];
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
            return false
             case 'knight':
                const possibleMoves = [
                    startId - 17, startId - 15,
                    startId + 17, startId + 15,
                    startId - 10, startId + 10,
                    startId - 6, startId + 6
                ];
                
                // Filter out moves that are off the board or wrap around
                const validMoves = possibleMoves.filter(move => {
                    const onBoard = move >= 0 && move < 64; // Ensure the move is on the board
                    const rowDiff = Math.floor(move / 8) - Math.floor(startId / 8);
                    const colDiff = move % 8 - startId % 8;
                    // Prevent wrapping around the board
                    return onBoard && Math.abs(rowDiff) <= 2 && Math.abs(colDiff) <= 2 && (Math.abs(rowDiff) + Math.abs(colDiff) === 3);
                });
    
                // Check if the target position is a valid knight move
                if (validMoves.includes(targetId)) {
                    return true;
                }
                break;

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
        case 'rook':
            const directionsRook = [
                -1, 1, // Left, right
                -width, width, // Up, down
            ];
        
            // Check each direction
            for (let i = 0; i < directionsRook.length; i++) {
                let move = startId;
                while (true) {  
                    move += directionsRook[i];
                
                    // Break if the move goes off the board
                    if (move < 0 || move >= width * width) break;
                
                    // Handling to avoid wrapping around the board
                    if (Math.floor(move / width) !== Math.floor((move - directionsRook[i]) / width) &&
                        [1, -1].includes(directionsRook[i])) break;
                
                    // Check if the move is the target position
                    if (move === targetId) return true;
                
                    // If the move hits another piece
                    if (document.querySelector(`[square-id="${move}"]`).firstChild) break;
                }
            }
        case 'king':
            const possibleKingMoves = [
                startId - width - 1, startId - width, startId - width + 1, // Up-left, Up, Up-right
                startId - 1, /* skip current position */ startId + 1, // Left, Right
                startId + width - 1, startId + width, startId + width + 1, // Down-left, Down, Down-right
            ];
        
            // Filter out moves that are off the board or wrap around
            const validKingMoves = possibleKingMoves.filter(move => {
                // Check if move is within the board
                const onBoard = move >= 0 && move < width * width;
        
                // Avoid wrapping around the board
                const rowDifference = Math.abs(Math.floor(move / width) - Math.floor(startId / width));
                const noWrapAround = rowDifference <= 1;
        
                return onBoard && noWrapAround;
            });
        
            // Check if the target square is a valid move
            if (validKingMoves.includes(targetId)) {
                return true;
            }
            break;
    }
}

function isKingInCheck(player) {
    let kingPosition = findKing(player);
    console.log("kingpostion " +kingPosition);
    if (kingPosition === undefined) {
        console.error(player + ' king not found on the board.');
        return false; 
    }

    let opponent = player === 'white' ? 'black' : 'white';
    let threatDirections = [
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, // left, right
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, // up, down
        { dx: -1, dy: -1 }, { dx: 1, dy: 1 }, // up-left, down-right
        { dx: 1, dy: -1 }, { dx: -1, dy: 1 }  // up-right, down-left
    ];

    // Check for linear threats from rook, queen, bishop
    if (checkLinearThreats(kingPosition, threatDirections, opponent)) {
        return true;
    }
    // Check for knight threats
    if (checkKnightThreat(kingPosition, opponent)) {
        return true;
    }

    // Check for pawn threats
    if (checkPawnThreat(kingPosition, opponent)) {
        return true;
    }

    console.log("King is not in check");
    return false; // No threats detected
}

function findKing(player) {
    const pieceClass = `${player}`;

    const squares = document.querySelectorAll('#gameboard .square');

    for (let square of squares) {
        if (square.firstChild 
            && square.firstChild.classList.contains(pieceClass) 
            && square.firstChild.id === "king") {
            // Return the square-id of the king's position
            return square.getAttribute('square-id');    
        }
    }

    // Return undefined if the king is not found
    return undefined;
}

function checkLinearThreats(kingPosition, directions, opponent) {
    const kingRow = Math.floor(kingPosition / width);
    const kingCol = kingPosition % width;

    for (let dir of directions) {
        let row = kingRow + dir.dy;
        let col = kingCol + dir.dx;
        while (row >= 0 && row < 8 && col >= 0 && col < 8) {
            const id = row * width + col;
            const square = document.querySelector(`[square-id="${id}"]`);
            if (square && square.firstChild) {
                if (square.firstChild.classList.contains(opponent) &&
                    (square.innerHTML.includes('queen') || square.innerHTML.includes('rook') || square.innerHTML.includes('bishop'))) {
                    return true;
                }
                break; // stop at the first blocked path
            }
            row += dir.dy;
            col += dir.dx;
        }
    }
    return false;
}

function checkKnightThreat(kingPosition, opponent) {
    let potentialPositions = [
        kingPosition - 17, kingPosition + 17,
        kingPosition - 15, kingPosition + 15,
        kingPosition - 10, kingPosition + 10,
        kingPosition - 6, kingPosition + 6
    ].filter(pos => pos >= 0 && pos < 64); // Ensure the move is on the board

    return potentialPositions.some(pos => {
        const square = document.querySelector(`[square-id="${pos}"]`);
        return square && square.firstChild && square.firstChild.classList.contains(opponent) && square.innerHTML.includes('knight');
    });
}

function checkPawnThreat(kingPosition, opponent) {
    let offsets = opponent === 'white' ? [-9, -7] : [7, 9]; 
    return offsets.some(offset => {
        const pos = kingPosition + offset;
        if (pos < 0 || pos >= 64) return false;
        const square = document.querySelector(`[square-id="${pos}"]`);
        return square && square.firstChild && square.firstChild.classList.contains(opponent) && square.innerHTML.includes('pawn');
    });
}

let kingMoved = { 'white': false, 'black': false };
let rookMoved = { 'white': { 'left': false, 'right': false }, 'black': { 'left': false, 'right': false } };

function canCastle(kingId, targetId) {
    kingId = parseInt(kingId, 10);
    targetId = parseInt(targetId, 10);

    const direction = targetId > kingId ? 'right' : 'left';
    const rookId = direction === 'right' ? kingId + 3 : kingId - 4;

    if (kingMoved[playergo] || rookMoved[playergo][direction]) {
        console.log("Castling failed: King or Rook has moved");
        return false;
    }

    const step = direction === 'right' ? 1 : -1;
    for (let i = kingId + step; i !== rookId + step; i += step) {
        if (document.querySelector(`[square-id="${i}"]`).firstChild) {
            console.log("Castling failed: Path between King and Rook is not clear");
            return false;
        }
    }

    if (isChecked || isKingInCheckDuringCastling(kingId, step, targetId)) {
        console.log("Castling failed: King is in check");
        return false;
    }

    return true;
}

function performCastle(startId, targetId) {
    if (!canCastle(startId, targetId)) {
        console.log("Castling not allowed");
        return;
    }

    const direction = targetId > startId ? 'right' : 'left';
    const rookStartId = direction === 'right' ? startId + 3 : startId - 4;
    const rookEndId = direction === 'right' ? targetId - 1 : targetId + 1;

    const king = document.querySelector(`[square-id="${startId}"]`).firstChild;
    const rook = document.querySelector(`[square-id="${rookStartId}"]`).firstChild;

    document.querySelector(`[square-id="${targetId}"]`).appendChild(king);
    document.querySelector(`[square-id="${rookEndId}"]`).appendChild(rook);

    kingMoved[playergo] = true;
    rookMoved[playergo][direction] = true;
    changePlayer();

    console.log("Castling performed successfully");
}

function isKingInCheckDuringCastling(kingId, step, targetId) {
    const positionsToCheck = [kingId, kingId + step, targetId];
    for (let position of positionsToCheck) {
        if (isKingInCheckBasedOnPosition(playergo, position)) {
            return true;
        }
    }
    return false;
}

function isKingInCheckDuringCastling(kingId, rookId, step) {
    // Check positions king moves through during castling
    for (let i = kingId; i !== rookId; i += step) {
        if (isKingInCheck(playergo)) {
            return true;
        }
    }
    return false;
}

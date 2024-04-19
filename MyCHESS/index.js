const gameboard = document.querySelector("#gameboard");
const playerdisplay = document.querySelector("#player");
const infordisplay = document.querySelector("#info-display");
const width = 8;
let playergo = 'white';
playerdisplay.textContent = 'white';
let isInCheck = false;
let startpositionId;
let draggedElement;
let kingMoved = { 'white': false, 'black': false };
let rookMoved = { 'white': { 'left': false, 'right': false }, 'black': { 'left': false, 'right': false } };

document.querySelector("#startGameButton").addEventListener("click", function() {
    createGameBoard();
});

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
    gameboard.innerHTML = ''; // Clear previous board
    const topLeftCorner = document.createElement('div');
    topLeftCorner.classList.add('label');
    gameboard.appendChild(topLeftCorner);

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

        if (i < 16 && square.firstChild) {
            square.firstChild.classList.add('black');
        }
        if (i >= 48 && square.firstChild) {
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

    const allsquares = document.querySelectorAll("#gameboard .square")
    console.log(allsquares);
    allsquares.forEach(square => {
        square.addEventListener('dragstart', dragStart);
        square.addEventListener('dragover', dragOver);
        square.addEventListener('drop', dragDrop);
    });
}

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

function dragDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const correctGo = draggedElement.classList.contains(playergo);
    const taken = e.target.classList.contains('piece');
    const valid = checkIfValid(e.target);
    const opponentGo = playergo === 'black' ? 'white' : 'black';
    const takenByOpponent = e.target?.classList.contains(opponentGo);
    const targetSquare = e.target.classList.contains('square') ? e.target : e.target.parentNode;
    const targetId = parseInt(targetSquare.getAttribute('square-id'));

    if (draggedElement.id === 'king' && Math.abs(startpositionId - targetId) === 2) {
        if (performCastle(parseInt(startpositionId), targetId)) {
            changePlayer();
        }
        return;
    }

    if (correctGo && valid) {
        if (takenByOpponent) {
            let captureSuccessful = movePiece(startpositionId, targetId, draggedElement);
            if (captureSuccessful) {
                e.target.remove();
                changePlayer();
            }
        } else if (!taken) {
            if (movePiece(startpositionId, targetId, draggedElement)) {
                changePlayer();
            }
        }
    }
}

function movePiece(startId, targetId, draggedElement) {
    const startSquare = document.querySelector(`[square-id="${startId}"]`);
    const targetSquare = document.querySelector(`[square-id="${targetId}"]`);
    const piece = targetSquare.firstChild;

    // Move the piece to the target square temporarily and remove the piece on the targetsquare
    targetSquare.appendChild(draggedElement);
    if(piece){
        piece.remove();
    }

    // Check if the move places your king in check
    if (isKingInCheck(playergo)) {
        // If the move results in a check, undo it
        startSquare.appendChild(draggedElement);
        if (piece) targetSquare.appendChild(piece); // Return any captured piece back to its original position
        infordisplay.textContent = 'Check! Move not allowed.';
        return false;
    } else {
        // If the move is valid, update UI and return true
        if (piece) piece.remove(); // Remove the captured piece from the board if any
        infordisplay.textContent = ''; // Clear any previous messages
        return true;
    }
}

function changePlayer(){
    if(playergo === 'black'){
        playergo = 'white';
        playerdisplay.textContent = 'white';
    } else {
        playergo = 'black';
        playerdisplay.textContent = 'black';
    }
}

function checkIfValid(target) {
    const targetId = Number(target.getAttribute('square-id')) || Number(target.parentNode.getAttribute('square-id'));
    const startId = Number(startpositionId);
    const piece = draggedElement.id;
    const pieceColor = draggedElement.classList.contains('white') ? 'white' : 'black';
    const direction = pieceColor === 'white' ? -1 : 1;

    switch (piece) {
        case 'pawn':
            // Standard forward move
            if (targetId === startId + direction * width && !target.firstChild) {
                return true;
            }
            // Double move from the starting position
            if ((pieceColor === 'white' && Math.floor(startId / width) === 6 || pieceColor === 'black' && Math.floor(startId / width) === 1) &&
                targetId === startId + direction * 2 * width &&
                !target.firstChild &&
                !document.querySelector(`[square-id="${startId + direction * width}"]`).firstChild) {
                return true;
            }
            const captureTargets = [startId + direction * width - 1, startId + direction * width + 1];
            if (captureTargets.includes(targetId)) {
                const targetSquare = document.querySelector(`[square-id="${targetId}"]`);
                if (targetSquare && targetSquare.firstChild && targetSquare.firstChild.classList.contains(pieceColor === 'white' ? 'black' : 'white')) {
                    return true;
                }
            }
            break;
            case 'knight':
                const knightMoves = [
                    -17, -15, -10, -6, 6, 10, 15, 17
                ];
                if (knightMoves.includes(targetId - startId)) {
                    const colStart = startId % width;
                    const colTarget = targetId % width;
                    const rowStart = Math.floor(startId / width);
                    const rowTarget = Math.floor(targetId / width);
                    const rowDiff = Math.abs(rowTarget - rowStart);
                    const colDiff = Math.abs(colTarget - colStart);
    
                    if (rowDiff == 1 && colDiff == 2 || rowDiff == 2 && colDiff == 1) {
                        return true;
                    }
                }
                break;

        case 'bishop':
            return DiagonalValidMoves(startId, targetId);

        case 'rook':
            return horizontalVertikalMoves(startId, targetId);

        case 'queen':
            console.log(horizontalVertikalMoves(startId, targetId));
            return DiagonalValidMoves(startId, targetId) || horizontalVertikalMoves(startId, targetId);

        case 'king':
            const kingMoves = [
                startId - 1, startId + 1, startId - width, startId + width,
                startId - width - 1, startId - width + 1, startId + width - 1, startId + width + 1
            ];
            if (kingMoves.includes(targetId)) {
                const colStart = startId % width;
                const colTarget = targetId % width;
                if (Math.abs(colTarget - colStart) <= 1) {
                    return true;
                }
            }
            break;
    }
    return false;
}

function DiagonalValidMoves(startId, targetId) {
    const directions = [-width - 1, -width + 1, width - 1, width + 1];
    return checkLinearMove(startId, targetId, directions);
}

function horizontalVertikalMoves(startId, targetId) {
    const directions = [-1, 1, -width, width];
    const startRow = Math.floor(startId / width);
    const startCol = startId % width;
    
    for (let direction of directions) {
        let pos = startId + direction;
        let currentRow = Math.floor(pos / width);
        let currentCol = pos % width;

        while (pos >= 0 && pos < 64) {
            // Ensure we do not wrap around the board horizontally
            if ([1, -1].includes(direction)) {
                if (currentCol < 0 || currentCol >= width || Math.abs(currentCol - startCol) > 1) break;
            }
            // Handle vertical moves correctly without wrapping
            if ([width, -width].includes(direction)) {
                if (currentRow < 0 || currentRow >= width) break;
            }

            if (pos === targetId) return true;

            // Check if there's a piece blocking the path (break if so)
            if (document.querySelector(`[square-id="${pos}"]`).firstChild) break;

            // Continue moving in the direction
            pos += direction;
            currentRow = Math.floor(pos / width);
            currentCol = pos % width;
        }
    }
    return false;
}

function checkLinearMove(startId, targetId, directions) {
    for (let direction of directions) {
        let pos = startId + direction;
        while (pos >= 0 && pos < 64) {
            const colDifference = Math.abs(Math.floor(pos % width) - Math.floor(startId % width));
            const rowDifference = Math.abs(Math.floor(pos / width) - Math.floor(startId / width));

            if ([1, -1].includes(direction) && colDifference > 1) break;
            if ([width, -width].includes(direction) && rowDifference > 1) break;

            if (pos === targetId) return true;
            if (document.querySelector(`[square-id="${pos}"]`).firstChild) break;

            pos += direction;
        }
    }
    return false;
}

function isKingInCheck(player) {
    let kingPosition = findKing(player);
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
        console.log("linear thread");
        return true;
    }
    // Check for knight threats
    if (checkKnightThreat(kingPosition, opponent)) {
        console.log("kngiht thread");
        return true;
    }

    // Check for pawn threats
    if (checkPawnThreat(kingPosition, opponent)) {
        console.log("pawn thread");
        return true;
    }

    return false; // No threats detected
}

function findKing(player) {
    const playerGo = `${player}`;

    const squares = document.querySelectorAll('#gameboard .square');

    for (let square of squares) {
        if (square.firstChild  && square.firstChild.classList.contains(playerGo) && square.firstChild.id === "king") {
            return square.getAttribute('square-id');    
        }
    }

    // Return undefined if the king is not found
    return undefined;
}

function checkLinearThreats(kingPosition, directions, opponent) {
    const width = 8; // Assuming the board is 8x8
    const kingRow = Math.floor(kingPosition / width);
    const kingCol = kingPosition % width;

    for (let dir of directions) {
        let row = kingRow + dir.dy;
        let col = kingCol + dir.dx;

        while (row >= 0 && row < width && col >= 0 && col < width) {
            const id = row * width + col;
            const square = document.querySelector(`[square-id="${id}"]`);

            if (square && square.firstChild) {
                const piece = square.firstChild;
                if (piece.classList.contains(opponent)) {
                    // Log the threatening piece and its position if it can move in a straight line and matches the type that can threaten from the current direction
                    if ((dir.dx === 0 || dir.dy === 0) && (piece.id === 'queen' || piece.id === 'rook') ||
                        (dir.dx !== 0 && dir.dy !== 0) && (piece.id === 'queen' || piece.id === 'bishop')) {
                        console.log(`King is in check by ${piece.id} at position (${row}, ${col})`);
                        return true;
                    }
                }
                break; // Any piece blocks further line of sight
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
    const kingRow = Math.floor(Number(kingPosition) / width);
    const kingCol = Number(kingPosition) % width;
    const direction = opponent === 'black' ? -1 : 1;  // Assuming white moves upwards

    const potentialThreats = [
        Number(Number(kingPosition) + direction * width - 1), 
        Number(Number(kingPosition) + direction * width + 1)
    ];

    // Check each position for a threatening pawn
    return potentialThreats.some(pos => {
        if (pos < 0 || pos >= 64) return false; // Ensure position is within bounds
        const square = document.querySelector(`[square-id="${pos}"]`);
        return square && square.firstChild && 
               square.firstChild.classList.contains(opponent) &&
               square.firstChild.id === 'pawn';
    });
}

function canCastle(kingId, targetId) {
    kingId = parseInt(kingId, 10);
    targetId = parseInt(targetId, 10);

    const direction = targetId > kingId ? 'left' : 'right';
    const rookId = direction === 'right' ? kingId - 3 : kingId + 4;
    if (kingMoved[playergo] || rookMoved[playergo][direction]) {
        console.log("Castling failed: King or Rook has moved");
        return false;
    }

    const step = direction === 'right' ? -1 : +1;
    // Adjust endSquare to stop checking one square before reaching the rook
    const endSquare = direction === 'right' ? rookId + 1 : rookId - 1;

for (let i = kingId + step; i !== endSquare + step; i += step) {
    // Check each square to see if it is occupied
    if (document.querySelector(`[square-id="${i}"]`).firstChild) {
        console.log(`Checking path for castling: King at ${kingId}, Rook at ${rookId}, direction ${direction}, checking from ${kingId + step} to ${endSquare}`);
        return false;
    }
}

    if (isInCheck || isKingInCheckDuringCastling(kingId, step, targetId)) {
        console.log("Castling failed: King is in check");
        return false;
    }
    console.log(`Checking path for castling: King at ${kingId}, Rook at ${rookId}, direction ${direction}, checking from ${kingId + step} to ${endSquare}`);
    return true;
}

function performCastle(startId, targetId) {
    if (!canCastle(startId, targetId)) {
        console.log("Castling not allowed");
        return;
    }

    const direction = targetId > startId ? 'right' : 'left';
    const rookStartId = direction === 'right' ? startId + 4 : startId - 3;
    const rookEndId = direction === 'right' ? targetId - 1 : targetId + 1;

    const king = document.querySelector(`[square-id="${startId}"]`).firstChild;
    const rook = document.querySelector(`[square-id="${rookStartId}"]`).firstChild;

    document.querySelector(`[square-id="${targetId}"]`).appendChild(king);
    document.querySelector(`[square-id="${rookEndId}"]`).appendChild(rook);

    kingMoved[playergo] = true;
    rookMoved[playergo][direction] = true;
    changePlayer();

}

function isKingInCheckDuringCastling(kingId, step, targetId) {
    const positionsToCheck = [kingId, kingId + step, targetId];
    for (let position of positionsToCheck) {
        if (isKingInCheck(playergo)) {
            return true;
        }
    }
    return false;
}
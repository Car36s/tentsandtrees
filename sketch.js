const height = 600
const width = 800

const fields = []
let size = 5

let side = 5
let centerOffset = size * side / 2

const tentCounts = []
const errorRows = []
const highlighted = { x: null, y: null }

function setup() {
    createCanvas(width, height)

    for (let ii = 0; ii < size; ii++){
        for (let jj = 0; jj < size; jj++){
            fields.push(new Field(ii, jj))
        }
    }

    generateTentsAndTrees()
    getRowAndColCounts()
}

function draw() {
    background(51)
    translate(width / 2 - centerOffset, height / 2 - centerOffset)
    
    fields.forEach(field => field.show())
    drawTentCounts()
    
    errorRows.forEach(index => {
        stroke(151, 51, 51)
        strokeWeight(2)
        if(index < size){
            rect(index * side + 3, -side + 3, side - 3, side * (size + 1) -3)
        } else {
            rect(-side + 3, index % size * side + 3, side * (size + 1) - 3, side - 3)
        }
    })

    if(highlighted.x < size && highlighted.x >= 0 && highlighted.y < size && highlighted.y >= 0){
        stroke(51, 151, 51)
        strokeWeight(3)
        rect(highlighted.x * side + 3, highlighted.y * side + 3, side - 6, side - 6)
    }

}

function mousePressed() {
    const highlightedId = getId(highlighted.x, highlighted.y)
    const highlightedField = fields.find(field => field.id === highlightedId)
    if(highlightedField) {
        highlightedField.cycleFieldType()
    }
}

function mouseMoved() {
    const x = Math.floor((mouseX - (width / 2 - centerOffset)) / side)
    const y = Math.floor((mouseY - (height / 2 - centerOffset)) / side)
    highlighted.x = x
    highlighted.y = y
}

function drawTentCounts() {
    stroke(151)
    strokeWeight(2)
    tentCounts.forEach((count, index) => {
        if(index < size) {
            rect(index * side, -side, side, side)
            text(count, index * side + side / 3, -side / 3)
        } else {
            rect(-side, (index - size) * side, side, side)
            text(count, -side / 3 * 2, (index - size) * side + side / 2)
        }
    })
}

function getRowAndColCounts() {
    fields.reduce((acc, field) => {
        if(field.checkTent) {
            acc[field.x] = ~~acc[field.x] + 1
            acc[field.y + size] = ~~acc[field.y + size] + 1
            return acc
        }

        acc[field.x] = acc[field.x] || 0
        acc[field.y + size] = acc[field.y + size] || 0
        
        return acc
    }, tentCounts)
}

function generateTentsAndTrees() {
    const openFields = fields.slice(0)
    let noMoreSpace = 0

    while (openFields.length > size && noMoreSpace < 10) {
        const newTent = Math.floor(Math.random() * openFields.length)

        const fieldToSet = fields.find(field => field.id === openFields[newTent].id)
        
        if(fieldToSet.fieldType) {
            noMoreSpace++
            continue
        }
        
        const treeId = getNeighbouringTreeId(openFields, fieldToSet)

        if(!treeId) {
            noMoreSpace++
            continue
        }

        fields.find(field => field.id === treeId).setFieldType('tree')
        fieldToSet.setCheckTent()

        for (let ii = 1; ii > -2; ii-- ) {
            for (let jj = 1; jj > -2; jj--) {
                const openFieldToFill = fields.find(field => field.id === getId(fieldToSet.x + ii, fieldToSet.y + jj))

                if (openFieldToFill) {
                    if (!openFieldToFill.fieldType) {
                        openFieldToFill.setFieldType('unchecked')
                    }

                    const index = openFields.findIndex(field => field.id === openFieldToFill.id)
                    if(index > -1) {
                        openFields.splice(index, 1)
                    }
                }
            }
        }
    }

    openFields.forEach(field => fields.find(f => field.id === f.id).setFieldType('unchecked'))
}

function getNeighbouringTreeId(openFields, current) {
    const possibleFields = []

    for (let ii = -1; ii < 2; ii += 2) {
        for(let jj = -1; jj < 2; jj += 2){
            let fieldToTree
            if(ii === -1) {
                fieldToTree = openFields.find(field => field.id === getId(current.x, current.y + jj))
            } else {
                fieldToTree = openFields.find(field => field.id === getId(current.x + jj, current.y))
            } 
            if (fieldToTree && !fieldToTree.fieldType){
                possibleFields.push(fieldToTree)
            }
        }
    }

    if (possibleFields.length){
        return possibleFields[Math.floor(Math.random() * possibleFields.length)].id
    }

    return null
} 



class Field {
    constructor(x, y){
        this.id = getId(x, y)
        this.x = x
        this.y = y
        this.fieldType
        this.checkTent = false
    }

    setCheckTent() {
        this.checkTent = true
    }

    setFieldType(type) {
        this.fieldType = FIELD_TYPES[type]
    }

    getFieldType() {
        return this.fieldType
    }

    cycleFieldType() {
        if(this.fieldType === FIELD_TYPES.tree) {
            return 
        }

        const nextFieldType = this.fieldType % 3
        this.setFieldType(FIELD_INDEXES[nextFieldType])

        checkForErrors()
    }

    show() {
        strokeWeight(1)
        stroke(191)
        if (this.fieldType === FIELD_TYPES.unchecked) {
            fill(200)
        }
        rect(this.x * side, this.y * side, side, side)
        noFill()
        strokeWeight(3)

        if(this.fieldType === FIELD_TYPES.tree){
            stroke(50, 200, 50)
            triangle(
                this.x * side + side / 2,
                this.y * side + side / 4,
                
                this.x * side + side / 3,
                this.y * side + 2 * side / 3,
                
                this.x * side + 2 * side / 3,
                this.y * side + 2 * side / 3
                )

            line(this.x * side + side / 2, this.y * side + 2 * side / 3, this.x * side + side / 2, this.y * side + 5 * side / 6)

        } else if (this.fieldType === FIELD_TYPES.tent) {
            stroke(200, 50, 50)
            strokeWeight(2)

            triangle(
                this.x * side + side / 2,
                this.y * side + side / 3,

                this.x * side + side / 3,
                this.y * side + 2 * side / 3,

                this.x * side + 2 * side / 3,
                this.y * side + 2 * side / 3
            )
            line(this.x * side + side / 2, this.y * side + 4 * side / 9, this.x * side + side / 2, this.y * side + 2 * side / 3)
        }


        /*            
        if(this.checkTent) {
            stroke(200, 50, 200)
            strokeWeight(2)

            triangle(
                this.x * side + side / 2,
                this.y * side + side / 3,

                this.x * side + side / 3,
                this.y * side + 2 * side / 3,

                this.x * side + 2 * side / 3,
                this.y * side + 2 * side / 3
            )
            line(this.x * side + side / 2, this.y * side + 4 * side / 9, this.x * side + side / 2, this.y * side + 2 * side / 3)

        }
        */
    }
}

let checkTimeout = null
let checkResults = []

function checkForErrors() {
    clearTimeout(checkTimeout)
    checkTimeout = setTimeout(() => {
        errorRows.length = 0
        checkResults = fields.reduce((acc, field, index) => {
            if (field.fieldType !== FIELD_TYPES.unchecked) {
                acc[0][field.x] = ~~acc[0][field.x] + 1
                acc[0][size + field.y] = ~~acc[0][size + field.y] + 1
            } else {
                acc[0][field.x] = ~~acc[0][field.x] || 0
                acc[0][size + field.y] = ~~acc[0][size + field.y] || 0
            }
            
            if (field.fieldType === FIELD_TYPES.tent) {
                acc[1][field.x] = ~~acc[1][field.x] + 1
                acc[1][size + field.y] = ~~acc[1][size + field.y] + 1
            } else {
                acc[1][field.x] = ~~acc[1][field.x] || 0
                acc[1][size + field.y] = ~~acc[1][size + field.y] || 0
            }
            
            return acc

        }, [[],[]])

        checkResults[0].reduce((acc, count, index) => {
            if(count === size && checkResults[1][index] !== tentCounts[index]) {
                acc.push(index)
            }
            return acc
        }, errorRows)

    }, 1000)
}

const FIELD_TYPES = Object.freeze({ unchecked: 1, empty: 2, tent: 3, tree: 4 })
const FIELD_INDEXES = Object.freeze(['unchecked', 'empty', 'tent', 'tree' ])

const getId = (x, y) => {
    return x + '-' + y
}
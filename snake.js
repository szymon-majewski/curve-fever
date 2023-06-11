let canvas = document.getElementById('Board');
let ctx = canvas.getContext('2d');

export class Snake
{
    thickness = 3;
    inputSensitivity = 0.1;
    speed = 3.1;
    defaultSpeed = 3.1;
    moveLeft = false;
    moveRight = false;
    name = "unnamed";
    score = 0;

    constructor(x, y, xDir, yDir, color)
    {
        this.x = x;
        this.y = y;
        this.xDir = xDir;
        this.yDir = yDir;
        this.color = color;

        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    move()
    {
        if (this.moveLeft)
        {
            if (this.yDir <= 0 && this.xDir > 0)
            {
                this.xDir -= this.inputSensitivity;
                this.yDir -= this.inputSensitivity;
            }
            else if (this.yDir > 0 && this.xDir >= 0)
            {
                this.xDir += this.inputSensitivity;
                this.yDir -= this.inputSensitivity;
            }
            else if (this.yDir >= 0 && this.xDir < 0)
            {
                this.xDir += this.inputSensitivity;
                this.yDir += this.inputSensitivity;
            }
            else if (this.yDir < 0 && this.xDir <= 0)
            {
                this.xDir -= this.inputSensitivity;
                this.yDir += this.inputSensitivity;
            }
        }
        if (this.moveRight)
        {
            if (this.yDir < 0 && this.xDir >= 0)
            {
                this.xDir += this.inputSensitivity;
                this.yDir += this.inputSensitivity;
            }
            else if (this.yDir >= 0 && this.xDir > 0)
            {
                this.xDir -= this.inputSensitivity;
                this.yDir += this.inputSensitivity;
            }
            else if (this.yDir > 0 && this.xDir <= 0)
            {
                this.xDir -= this.inputSensitivity;
                this.yDir -= this.inputSensitivity;
            }
            else if (this.yDir <= 0 && this.xDir < 0)
            {
                this.xDir += this.inputSensitivity;
                this.yDir -= this.inputSensitivity;
            }
        }

        this.xDir = Math.round(this.xDir * 20) / 20;
        this.yDir = Math.round(this.yDir * 20) / 20;

        this.x += this.xDir * this.speed;
        this.y += this.yDir * this.speed;
    }

    drawHead()
    {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.thickness, 0, 2 * Math.PI, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    handleKeyDown(event)
    {
        if (event.key === 'a' || event.key === 'A')
        {
            this.moveLeft = true;
        } 
        else if (event.key === 'd' || event.key === 'D')
        {
            this.moveRight = true;   
        }
    }

    handleKeyUp(event)
    {
        if (event.key === 'a' || event.key === 'A')
        {
            this.moveLeft = false;
        } 
        else if (event.key === 'd' || event.key === 'D')
        {
            this.moveRight = false;   
        }
    }
}
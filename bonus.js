let canvas = document.getElementById('Board');
let canvasRect = canvas.getBoundingClientRect();
let canvasTop = canvasRect.top;
let canvasLeft = canvasRect.left;

class Bonus
{
    draw()
    {
        this.wrapper = document.createElement('div');
        this.wrapper.classList.add('bonusImage');
        this.wrapper.style.left = 500;
        this.wrapper.style.top = canvasTop + this.y + 'px';
        this.wrapper.style.left = canvasLeft + this.x + 'px';
        this.wrapper.appendChild(this.img);
        document.body.appendChild(this.wrapper);
    }

    erase()
    {
        this.wrapper.parentNode.removeChild(this.wrapper);
    }
}

export class SlowDownBonus extends Bonus
{
    constructor(id, x, y)
    {
        super();
        this.img = new Image(30, 30);
        this.img.onload = () =>
        {
            this.draw();
        };
        this.img.src = "res/slow_down.png";

        this.id = id;
        this.x = x;
        this.y = y;
        this.speedModifier = 0.5;
        this.duration = 5000;
        this.diameter = 30;
    }

    action(snake)
    {
        snake.speed *= this.speedModifier

        setTimeout(() =>
        {
            snake.speed = snake.defaultSpeed;
        }, this.duration)
    }
}

export class SpeedUpBonus extends Bonus
{
    constructor(id, x, y)
    {
        super();
        this.img = new Image(30, 30);
        this.img.onload = () =>
        {
            this.draw();
        };
        this.img.src = "res/speed_up.png";
        this.id = id;
        this.x = x;
        this.y = y;
        this.speedModifier = 1.5;
        this.duration = 5000;
        this.diameter = 30;
    }

    action(snake)
    {
        snake.speed *= this.speedModifier

        setTimeout(() =>
        {
            snake.speed = snake.defaultSpeed;
        }, this.duration)
    }
}
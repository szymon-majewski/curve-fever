let canvas = document.getElementById('Board');
let ctx = canvas.getContext('2d');

export class SlowDownBonus
{
    constructor(id, x, y)
    {
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
        this.diameter = 25;
    }

    draw()
    {
        ctx.drawImage(this.img, this.x, this.y, this.diameter, this.diameter);
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

export class SpeedUpBonus
{
    constructor(id, x, y)
    {
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
        this.diameter = 25;
    }

    draw()
    {
        ctx.drawImage(this.img, this.x, this.y, this.diameter, this.diameter);
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
var width = 400;
var height = 400;
var xSpeed = 5;
var ySpeed = 5;
var numParticles = 100;

//	Set up canvas
var c = document.getElementById("myCanvas");
c.width = width;
c.height = height;
var ctx = c.getContext("2d");

//	Initialize random particles to the tree.
var size = new Point(width/2, height/2);
var center = new Point(width/2, height/2);
var box = new BoundingBox(center, size);
var node = new QuadTree(box, null);

for (var i = 0; i < numParticles; i++)
{
	var rX = Math.floor((Math.random() * 360) + 20);
	var rY = Math.floor((Math.random() * 360) + 20);
	var rH = Math.floor((Math.random() * xSpeed) + 1);
	var rV = Math.floor((Math.random() * ySpeed) + 1);
	var o = {x:rX, y:rY, moveX:rH, moveY:rV, tag:i};
	node.insert(o);
}

//	Schedule the tick method
var t = setInterval(function() { tick() }, 50);

function Point(x, y)
{
	this.x = x;
	this.y = y;
}

//	BBox representing a nodes space.
function BoundingBox(center, size)
{
	this.center = center;
	this.size = size;

	this.hasPoint = function(point)
	{
		if (point.x >= (this.center.x - this.size.x) 
		 && point.x <= (this.center.x + this.size.x)
		 && point.y >= (this.center.y - this.size.y) 
		 && point.y <= (this.center.y + this.size.y))
		{
			return true;
		}
		else { return false; }
	}
	this.doesIntersect = function(box)
	{
		if ((this.center.x - this.size.x)  <= (box.center.x + box.size.x) 
		&& (this.center.x + this.size.x) >= (box.center.x - box.size.x) 
		&& (this.center.y - this.size.y) <= (box.center.y + box.size.y)
		&& (this.center.y + this.size.y) >= (box.center.y - box.size.y))
		{
			return true;
		}
		else { return false; }
	}
}

//	Each node is a quarter space of its parent.
//	Max num of points in node = 4.
function QuadTree(box, parent)
{
	this.box = box;
	this.topL = null;
	this.topR = null;
	this.botL = null;
	this.botR = null;
	this.parentNode = parent;

	this.points = [];

	this.insert = function(point)
	{
		if (!this.box.hasPoint(point)) { return false; }

		if (this.points.length < 2)
		{
			this.points.push(point);
			return true;
		}

		if (this.topL === null) { this.subdivide(); }

		if (this.topL.insert(point)) { return true; }
		if (this.topR.insert(point)) { return true; }
		if (this.botL.insert(point)) { return true; }
		if (this.botR.insert(point)) { return true; }
		//	Will never get past here
		return false;
	}
	this.subdivide = function()
	{	
		//	Subdivide the region into smaller children.
		var size = new Point(this.box.size.x/2, this.box.size.y/2);

		var center = new Point(this.box.center.x - (this.box.size.x/2), 
								this.box.center.y - (this.box.size.y/2));
		var box = new BoundingBox(center, size);
		this.topL = new QuadTree(box, this);

		var center = new Point(this.box.center.x + (this.box.size.x/2), 
								this.box.center.y - (this.box.size.y/2));
		var box = new BoundingBox(center, size);
		this.topR = new QuadTree(box, this);

		var center = new Point(this.box.center.x - (this.box.size.x/2), 
								this.box.center.y + (this.box.size.y/2));
		var box = new BoundingBox(center, size);
		this.botL = new QuadTree(box, this);

		var center = new Point(this.box.center.x + (this.box.size.x/2), 
								this.box.center.y + (this.box.size.y/2));
		var box = new BoundingBox(center, size);
		this.botR = new QuadTree(box, this);
	}
	this.retrieve = function(range)
	{
		//	Retrieves all the points in the desired range.
		var result = [];
		if (!this.box.doesIntersect(range)) { return result; }

		if (this.points.length > 0)
		{
			drawGrid(this.box);
		}
		for (var i = 0; i < this.points.length; i++)
		{
			if (range.hasPoint(this.points[i]))
			{
				result.push(this.points[i]);
			}
		}
		if (this.topL === null) { return result; }

		//	Recurse down the children.
		result.push.apply(result, this.topL.retrieve(range));
		result.push.apply(result, this.topR.retrieve(range));
		result.push.apply(result, this.botL.retrieve(range));
		result.push.apply(result, this.botR.retrieve(range));
		return result;
	}
	//	Move points if they have moved outside of their nodes boundary
	this.update = function()
	{
		var temp = [];
		while (this.points.length > 0)
		{
			var point = this.points.pop();
			if (!this.box.hasPoint(point))
			{
				//	Remove
				this.parentNode.passUp(point);
			}
			else
			{
				temp.push(point);
			}
		}
		this.points.push.apply(this.points, temp);
		//	Update children
		if (this.topL !== null)
		{
			this.topL.update();
			this.topR.update();
			this.botL.update();
			this.botR.update();
		}
	}
	//	Passes up points that no longer fit in it's region.
	//	The parent will determine what to do.
	this.passUp = function(point)
	{
		if (!this.box.hasPoint(point))
		{
			this.parentNode.passUp(point);
		}
		else
		{
			this.insert(point);
		}
	}
}

//	Takes array of rects, draws them.
function draw(a)
{
	ctx.fillStyle = "#fd9720";
	ctx.lineWidth = 2;
    ctx.strokeStyle = '#000000';

	//	Fill with circles
	for (var i = 0; i < a.length; i++)
	{
		var o = a[i];

 		ctx.beginPath();
		ctx.arc(o.x, o.y, 4.5, 0, Math.PI*2, true); 
		ctx.closePath();
		ctx.fill();
      	ctx.stroke();
		//ctx.fillRect(o.x, o.y, 5, 5);
	}
}

//	Takes a nodes boundary and draws it
//	for demo purposes.
function drawGrid(o)
{
	ctx.strokeStyle = "#65d9ef"
	ctx.strokeRect(o.center.x - o.size.x, o.center.y - o.size.y, o.size.x*2, o.size.y*2);
}

//	Takes array of rects, progresses there movement
function tick()
{
	ctx.clearRect(0, 0, width, height);
	ctx.fillStyle = "#272822";
	ctx.fillRect(0, 0, width, height);
	var a = node.retrieve(box);
	for (var i = 0; i < a.length; i++)
	{
		a[i].x = a[i].x + a[i].moveX;
		a[i].y = a[i].y + a[i].moveY;
		if ((a[i].x > (width - 10)) || (a[i].x < 10))
		{
			a[i].moveX = -a[i].moveX;
		}
		if ((a[i].y > (height - 10)) || (a[i].y < 10))
		{
			a[i].moveY = -a[i].moveY;
		}
	}
	node.update();
	draw(a);
}

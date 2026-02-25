export class GoldChart {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.padding = { top: 20, right: 20, bottom: 30, left: 40 };
    this.chartWidth = this.width - this.padding.left - this.padding.right;
    this.chartHeight = this.height - this.padding.top - this.padding.bottom;
    this.points = [];
    
    // Tooltip element
    this.tooltip = document.createElement('div');
    this.tooltip.style.position = 'absolute';
    this.tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    this.tooltip.style.color = '#fff';
    this.tooltip.style.padding = '5px';
    this.tooltip.style.borderRadius = '4px';
    this.tooltip.style.fontSize = '12px';
    this.tooltip.style.display = 'none';
    this.tooltip.style.pointerEvents = 'none';
    document.body.appendChild(this.tooltip);

    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseout', () => this.tooltip.style.display = 'none');
  }

  render(data) {
    const normalizedData = (data || [])
      .map(point => ({ ...point, value: Number(point.value) }))
      .filter(point => Number.isFinite(point.value));

    this.data = normalizedData;
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    if (normalizedData.length === 0) return;

    // Calculate min and max for scaling
    const prices = normalizedData.map(d => d.value);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice;
    
    // Add Y padding. Keep a non-zero range so flat data still renders.
    if (range === 0) {
      const padding = Math.max(Math.abs(maxPrice) * 0.01, 1);
      this.minY = minPrice - padding;
      this.maxY = maxPrice + padding;
    } else {
      this.minY = minPrice - range * 0.1;
      this.maxY = maxPrice + range * 0.1;
    }
    this.rangeY = this.maxY - this.minY;

    this.drawAxes();
    this.drawLine(normalizedData);
    this.drawPoints(normalizedData);
  }

  getY(value) {
    if (!Number.isFinite(this.rangeY) || this.rangeY <= 0) {
      return this.padding.top + this.chartHeight / 2;
    }
    return this.height - this.padding.bottom - ((value - this.minY) / this.rangeY) * this.chartHeight;
  }

  getX(index, total) {
    if (total <= 1) {
      return this.padding.left + this.chartWidth / 2;
    }
    return this.padding.left + (index / (total - 1)) * this.chartWidth;
  }

  drawAxes() {
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#444';
    this.ctx.lineWidth = 1;
    
    // Y Axis
    this.ctx.moveTo(this.padding.left, this.padding.top);
    this.ctx.lineTo(this.padding.left, this.height - this.padding.bottom);
    
    // X Axis
    this.ctx.moveTo(this.padding.left, this.height - this.padding.bottom);
    this.ctx.lineTo(this.width - this.padding.right, this.height - this.padding.bottom);
    
    this.ctx.stroke();

    // Draw Y Axis Labels (Min, Max)
    this.ctx.fillStyle = '#9CA3AF';
    this.ctx.font = '10px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(this.maxY.toFixed(0), this.padding.left - 5, this.padding.top + 5);
    this.ctx.fillText(this.minY.toFixed(0), this.padding.left - 5, this.height - this.padding.bottom);
  }

  drawLine(data) {
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#FFD700';
    this.ctx.lineWidth = 2;
    
    data.forEach((point, index) => {
      const x = this.getX(index, data.length);
      const y = this.getY(point.value);
      if (index === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    });
    
    this.ctx.stroke();

    if (data.length < 2) return;
    
    // Fill area under line
    this.ctx.lineTo(this.getX(data.length - 1, data.length), this.height - this.padding.bottom);
    this.ctx.lineTo(this.padding.left, this.height - this.padding.bottom);
    this.ctx.closePath();
    this.ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
    this.ctx.fill();
  }

  drawPoints(data) {
    this.points = [];
    this.ctx.fillStyle = '#FFD700';
    
    data.forEach((point, index) => {
      const x = this.getX(index, data.length);
      const y = this.getY(point.value);
      
      this.points.push({ x, y, data: point });

      this.ctx.beginPath();
      this.ctx.arc(x, y, 3, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Draw X Labels
      this.ctx.fillStyle = '#9CA3AF';
      this.ctx.textAlign = 'center';
      this.ctx.font = '9px Arial';
      // Show every other label to avoid crowding
      if (index % 2 === 0 || index === data.length - 1) {
          this.ctx.fillText(point.label, x, this.height - this.padding.bottom + 12);
      }
      this.ctx.fillStyle = '#FFD700'; // Reset fill for next point
    });
  }

  handleMouseMove(e) {
    if (!this.points || this.points.length === 0) {
      this.tooltip.style.display = 'none';
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    let closestPoint = null;
    let minDistance = 20; // Hit radius

    this.points.forEach(point => {
      const distance = Math.abs(mouseX - point.x);
      if (distance < minDistance) {
        closestPoint = point;
        minDistance = distance;
      }
    });

    if (closestPoint) {
      this.tooltip.style.display = 'block';
      this.tooltip.style.left = (e.pageX + 10) + 'px';
      this.tooltip.style.top = (e.pageY - 20) + 'px';
      this.tooltip.innerHTML = `
        <div style="font-weight:bold">${closestPoint.data.dateFull}</div>
        <div>Price: ¥${closestPoint.data.value.toFixed(2)}</div>
      `;
      this.canvas.style.cursor = 'pointer';
    } else {
      this.tooltip.style.display = 'none';
      this.canvas.style.cursor = 'default';
    }
  }
}

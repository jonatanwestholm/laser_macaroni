var macaroni = {

    size: 30,
    vx: function() {return this.size * Math.sqrt(3)},
    vy: function() {return this.size * 0},
    ux: function() {return this.size * Math.sqrt(3)/2},
    uy: function() {return this.size * 3/2},
    hex: function() {
          return [[this.vx()/2,  -this.uy()/3], [this.vx()/2 , this.uy()/3], 
                  [0          , 2*this.uy()/3], [-this.vx()/2, this.uy()/3], 
                  [-this.vx()/2, -this.uy()/3], [0         ,-2*this.uy()/3]]
    },
    angle2deltas: {0:  [1, 0], 1: [1, -1], 2: [0, -1],
                   3: [-1, 0], 4: [-1, 1], 5: [0,  1]},
    hexes: [],

    make_draggable: function(event){
        var svg = event.target
        svg.addEventListener("mousedown", start_drag)
        svg.addEventListener("contextmenu", start_drag)
        svg.addEventListener("mousemove", drag)
        svg.addEventListener("mouseup", end_drag)
        svg.addEventListener("mouseleave", end_drag)

        var elem = false
        var offsets = false

        this.draw_grid()
        this.spawn()
        this.draw_laser()

        function start_drag(event){
            event.preventDefault();
            if (event.target.classList.contains("draggable")){

                if (event.button == 0){
                    // left click
                    elem = event.target.parentElement
                    offset = get_offset(elem, event)
                }else if (event.button == 1){
                    // mouse wheel click
                    var target = event.target.parentElement
                    if (!target.classList.contains("hex")){
                        target = target.parentElement
                    }
                    var mid = { x: target.getAttributeNS(null, "x"),
                                y: target.getAttributeNS(null, "y")}
                    var rot = parseInt(target.getAttributeNS(null, "rotation")) || 0
                    var delta = event.shiftKey ? -60 : 60
                    rot = (rot + delta) % 360
                    var cx = macaroni.ux()
                    var cy = macaroni.uy()
                    target.setAttributeNS(null, "rotation", rot)
                    target.setAttributeNS(null, "transform", `rotate(${rot} ${cx} ${cy})`)
                    for (child_idx in [0, 1]){
                        var child = target.children[child_idx]
                        child.setAttributeNS(null, "rotation", rot)
                        child.setAttributeNS(null, "transform", `rotate(${rot} ${cx} ${cy})`)
                    }
                    id = parseInt(target.getAttributeNS(null, "id"))
                    macaroni.hexes[id][2] = (macaroni.hexes[id][2] + delta/60 + 6) % 6
                    macaroni.draw_laser()
                }
            }
        }

        function drag(event){
            if (elem){
                event.preventDefault()
                var coord = get_mouse_position(event)
                coord = macaroni.hexgrid_rounding(coord.x, coord.y)
                elem.setAttributeNS(null, "x", parseInt(coord.x - macaroni.vx() / 2 + 0.5))
                elem.setAttributeNS(null, "y", parseInt(coord.y - macaroni.uy() + 0.5))
            }
        }

        function end_drag(event){
            if (elem){
                event.preventDefault()
                var coord = get_mouse_position(event)
                coord = macaroni.hexgrid_rounding(coord.x, coord.y)
                elem.setAttributeNS(null, "x", parseInt(coord.x - macaroni.vx() / 2 + 0.5))
                elem.setAttributeNS(null, "y", parseInt(coord.y - macaroni.uy() + 0.5))

                var id = parseInt(elem.getAttributeNS(null, "id"))
                console.log(id)
                macaroni.hexes[id][0] = coord.coord_u
                macaroni.hexes[id][1] = coord.coord_v
                elem = false
            }
            macaroni.draw_laser()
        }

        function get_offset(elem, event){
            var coord = get_mouse_position(event)
            return { x: coord.x - elem.getAttributeNS(null, "x"),
                     y: coord.y - elem.getAttributeNS(null, "y")}
        }

        function get_mouse_position(event){
            var CTM = svg.getScreenCTM();
            return {
                x: (event.x - CTM.e) / CTM.a,
                y: (event.y - CTM.f) / CTM.d
            }
        }
    },

    hexgrid_rounding: function(x, y){
        // rounds x and y to the nearest hexagon center,
        // using linear algebra
        var vx = this.vx()
        var vy = this.vy()
        var ux = this.ux()
        var uy = this.uy()
        var size = this.size

        Ainv11 = 0 / size
        Ainv12 = 2/3 / size
        Ainv21 = 1/Math.sqrt(3) / size
        Ainv22 = -1/3 / size

        coord_u = parseInt( Ainv11 * x + Ainv12 * y + 0.5)
        coord_v = parseInt( Ainv21 * x + Ainv22 * y + 0.5)

        return { x: coord_u * ux + coord_v * vx,
                 y: coord_u * uy + coord_v * vy,
                 coord_u: coord_u,
                 coord_v: coord_v}
    },

    spawn: function(){
        const svgbox = document.getElementById("svgbox_macaroni");
        svgbox.append(this.draw_tile(0, 1))
        svgbox.append(this.draw_tile(0, 2))
        svgbox.append(this.draw_tile(0, 3))
        svgbox.append(this.draw_tile(0, 4))
        svgbox.append(this.draw_tile(0, 5))
        svgbox.append(this.draw_tile(0, 6))

        for (i of Array(7).keys()){
            this.draw_point()
        }
    },

    draw_point: function(){
        var vx = this.vx()
        var vy = this.vy()
        var ux = this.ux()
        var uy = this.uy()
        var size = this.size

        var cu = Math.floor(Math.random() * 10) + 1
        var cv = Math.floor(Math.random() * 10) + 1
        const svgbox = document.getElementById("svgbox_macaroni");

        //d = `cx=${cu * ux + cv * vx} cy=${cu * uy + cv * vy} r=5`
        point = document.createElementNS("http://www.w3.org/2000/svg", "circle")
        point.setAttributeNS(null, "style", `fill:#00ff00;stroke:#000000;stroke-width:0.1px`)
        //point.setAttributeNS(null, "circle", d)
        point.setAttributeNS(null, "cx", cu * ux + cv * vx)
        point.setAttributeNS(null, "cy", cu * uy + cv * vy)
        point.setAttributeNS(null, "r", 5)
        svgbox.appendChild(point)
    },

    draw_tile: function(i, j){
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
        svg.setAttributeNS(null, "class", `draggable hex`)
        var smallest_unused_id = this.hexes.length
        var id = smallest_unused_id
        this.hexes.push([i, j, 0])
        svg.setAttributeNS(null, "id", id)
        svg.setAttributeNS(null, "x", this.ux() * i + this.vx() * j)
        svg.setAttributeNS(null, "y", this.uy() * i + this.vy() * j)

        const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon")
        polygon.setAttributeNS(null, "class", `drawable draggable polygon`)
        polygon.setAttributeNS(null, "z-index", 1)
        polygon.setAttributeNS(null, "style", `fill:#cccccc;stroke:#000000;stroke-width:1px`)
        var cx = this.ux()
        var cy = this.uy()
        var hex = this.hex()
        var points = `${hex[0][0] + cx}, ${hex[0][1] + cy} 
                      ${hex[1][0] + cx}, ${hex[1][1] + cy} 
                      ${hex[2][0] + cx}, ${hex[2][1] + cy} 
                      ${hex[3][0] + cx}, ${hex[3][1] + cy} 
                      ${hex[4][0] + cx}, ${hex[4][1] + cy} 
                      ${hex[5][0] + cx}, ${hex[5][1] + cy}`
        polygon.setAttributeNS(null, "points", points)

        const arc_element = document.createElementNS("http://www.w3.org/2000/svg", "g")
        var d = this.get_small_arc(0)
        var path = document.createElementNS("http://www.w3.org/2000/svg", "path")
        path.setAttributeNS(null, "class", "draggable path")
        path.setAttributeNS(null, "pointer-events", "none")
        path.setAttributeNS(null, "style", `fill:#ffffff;stroke:#000000;stroke-width:3px`)
        path.setAttributeNS(null, "d", d)

        arc_element.appendChild(path)        
        svg.appendChild(polygon)
        svg.appendChild(arc_element)
        return svg
    },

    get_small_arc: function(a){
        const b = (a + 1) % 6
        const c = (a + 2) % 6
        var cx = this.ux()
        var cy = this.uy()
        var hex = this.hex()
        var size = this.size
        return `M ${hex[a][0] * 2/3 + hex[b][0] * 1/3 + cx} ${hex[a][1] * 2/3 + hex[b][1] * 1/3 + cy} 
                A ${0.667 * size} ${0.667 * size} 0 0 0 ${hex[c][0] * 2/3 + hex[b][0] * 1/3 + cx} ${hex[c][1] * 2/3 + hex[b][1] * 1/3 + cy}
                L ${hex[c][0] * 1/3 + hex[b][0] * 2/3 + cx} ${hex[c][1] * 1/3 + hex[b][1] * 2/3 + cy}
                A ${0.333 * size} ${0.333 * size} 0 0 1 ${hex[a][0] * 1/3 + hex[b][0] * 2/3 + cx} ${hex[a][1] * 1/3 + hex[b][1] * 2/3 + cy} z`
    },

    draw_laser: function(){
        this.flush_laser()

        var ux = this.ux()
        var uy = this.uy()
        var vx = this.vx()
        var vy = this.vy()
        var cx = ux
        var cy = uy
        var size = this.size
        var inf = 100

        const svgbox = document.getElementById("svgbox_macaroni");

        const laser = document.createElementNS("http://www.w3.org/2000/svg", "g")
        laser.setAttributeNS(null, "id", "laser")
        var d = `M ${cx} ${cy} `
        var cu = 0
        var cv = 0
        var angle = 0

        while(true){
            delta_u = this.angle2deltas[angle][0]
            delta_v = this.angle2deltas[angle][1]
            res = this.find_next_turn(cu, cv, delta_u, delta_v, angle)
            if (res == null){
                cu = cu + delta_u * inf
                cv = cv + delta_v * inf
                d += `\nL ${cu * ux + cv * vx} ${cu * uy + cv * vy}`
                break
            } else{
                cu = res.cu
                cv = res.cv
                edge1 = [cu * ux + cv * vx - delta_u * ux / 2 - delta_v * vx / 2, 
                         cu * uy + cv * vy - delta_u * uy / 2 - delta_v * vy / 2]
                sweep = res.angle == (angle + 4) % 6 ? 0 : 1
                angle = res.angle
                if(res.dead){
                    d += `\nL ${edge1[0]} ${edge1[1]}`
                    break
                }else{
                    delta_u = this.angle2deltas[angle][0]
                    delta_v = this.angle2deltas[angle][1]
                    edge2 = [cu * ux + cv * vx + delta_u * ux / 2 + delta_v * vx / 2, 
                             cu * uy + cv * vy + delta_u * uy / 2 + delta_v * vy / 2]
                    d += `\nL ${edge1[0]} ${edge1[1]} 
                            A ${0.5 * size} ${0.5 * size} 0 0 ${sweep} ${edge2[0]} ${edge2[1]}`                    
                }
            }
        }

        var path = document.createElementNS("http://www.w3.org/2000/svg", "path")
        path.setAttributeNS(null, "class", "path")
        path.setAttributeNS(null, "class", "drawable line")
        path.setAttributeNS(null, "z-index", 0)
        path.setAttributeNS(null, "pointer-events", "none")
        path.setAttributeNS(null, "style", `fill:none;stroke:#ff0000;stroke-width:5px`)
        path.setAttributeNS(null, "d", d)

        laser.appendChild(path)
        svgbox.appendChild(laser) 
    },

    flush_laser: function() {
        const svgbox = document.getElementById("svgbox_macaroni");
        laser = document.getElementById("laser")
        if (laser){
            svgbox.removeChild(laser)
        }
    },

    find_next_turn: function(cu, cv, delta_u, delta_v, angle){
        var coord_u = cu
        var coord_v = cv
        var iter = 0
        while (coord_u >= 0 && coord_u + coord_v >= 0 && coord_u < 50 && coord_v < 50 && iter < 100){
            iter += 1
            coord_u += delta_u
            coord_v += delta_v
            for (idx in this.hexes){
                hex = this.hexes[idx]
                if (hex[0] == coord_u && hex[1] == coord_v){
                    if (angle == (hex[2] + 2) % 6){
                        ang = (angle - 2 + 6) % 6
                        return { cu: coord_u,
                                 cv: coord_v,
                                 angle: ang,
                                 dead: false
                               }
                    }
                    if (angle == (hex[2] + 3) % 6){
                        ang = (angle + 2) % 6
                        return { cu: coord_u,
                                 cv: coord_v,
                                 angle: ang,
                                 dead: false
                               }
                    }
                    return { cu: coord_u,
                             cv: coord_v,
                             angle: angle,
                             dead: true
                           }   
                }
            }
        }
        return null
    },

    draw_grid: function(){
        N = 50

        for(i of Array(N).keys()){
            for(j of Array(N).keys()){
                this.draw_hex(i, j - parseInt(i / 2))
            }
        }
    },

    draw_hex: function(i, j){
        var hex = this.hex()
        // offset
        cx = this.ux() * i + this.vx() * j
        cy = this.uy() * i + this.vy() * j

        this.draw_line(hex[0][0] + cx, hex[1][0] + cx, hex[0][1] + cy, hex[1][1] + cy)
        this.draw_line(hex[1][0] + cx, hex[2][0] + cx, hex[1][1] + cy, hex[2][1] + cy)
        this.draw_line(hex[2][0] + cx, hex[3][0] + cx, hex[2][1] + cy, hex[3][1] + cy)
    },

    draw_line: function(x1, x2, y1, y2){
        const svgbox = document.getElementById("svgbox_macaroni");

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttributeNS(null, "x1", x1);
        line.setAttributeNS(null, "x2", x2);
        line.setAttributeNS(null, "y1", y1);
        line.setAttributeNS(null, "y2", y2);
        line.setAttributeNS(null, "style", "stroke:rgb(50, 50, 50);stroke-width:0.5");

        svgbox.appendChild(line);
    },
}

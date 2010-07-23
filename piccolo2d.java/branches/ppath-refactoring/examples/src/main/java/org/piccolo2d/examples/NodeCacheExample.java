/*
 * Copyright (c) 2008-2010, Piccolo2D project, http://piccolo2d.org
 * Copyright (c) 1998-2008, University of Maryland
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided
 * that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this list of conditions
 * and the following disclaimer.
 *
 * Redistributions in binary form must reproduce the above copyright notice, this list of conditions
 * and the following disclaimer in the documentation and/or other materials provided with the
 * distribution.
 *
 * None of the name of the University of Maryland, the name of the Piccolo2D project, or the names of its
 * contributors may be used to endorse or promote products derived from this software without specific
 * prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
package org.piccolo2d.examples;

import java.awt.BasicStroke;
import java.awt.Color;

import org.piccolo2d.PCanvas;
import org.piccolo2d.event.PDragEventHandler;
import org.piccolo2d.extras.PFrame;
import org.piccolo2d.extras.nodes.PNodeCache;
import org.piccolo2d.nodes.PPath;


public class NodeCacheExample extends PFrame {

    /**
     * 
     */
    private static final long serialVersionUID = 1L;

    public NodeCacheExample() {
        this(null);
    }

    public NodeCacheExample(final PCanvas aCanvas) {
        super("NodeCacheExample", false, aCanvas);
    }

    public void initialize() {
        final PCanvas canvas = getCanvas();

        final PPath circle = PPath.createEllipse(0, 0, 100, 100);
        circle.setStroke(new BasicStroke(10));
        circle.setPaint(Color.YELLOW);

        final PPath rectangle = PPath.createRectangle(-100, -50, 100, 100);
        rectangle.setStroke(new BasicStroke(15));
        rectangle.setPaint(Color.ORANGE);

        final PNodeCache cache = new PNodeCache();
        cache.addChild(circle);
        cache.addChild(rectangle);

        cache.invalidateCache();

        canvas.getLayer().addChild(cache);
        canvas.removeInputEventListener(canvas.getPanEventHandler());
        canvas.addInputEventListener(new PDragEventHandler());
    }

    public static void main(final String[] args) {
        new NodeCacheExample();
    }
}

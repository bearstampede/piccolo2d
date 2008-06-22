/**
 * Copyright (C) 1998-2000 by University of Maryland, College Park, MD 20742, USA
 * All rights reserved.
 */
package edu.umd.cs.piccolox.pswing;

import edu.umd.cs.piccolo.PNode;
import edu.umd.cs.piccolo.event.PInputEvent;
import edu.umd.cs.piccolo.util.PPickPath;

import java.awt.*;
import java.awt.event.MouseEvent;
import java.awt.event.MouseListener;
import java.awt.event.MouseMotionListener;
import java.awt.geom.Point2D;
import java.io.Serializable;

/**
 * <b>PMouseEvent</b> is an event which indicates that a mouse action occurred in a node.
 * <p/>
 * This low-level event is generated by a node object for:
 * <ul>
 * <li>Mouse Events
 * <ul>
 * <li>a mouse button is pressed
 * <li>a mouse button is released
 * <li>a mouse button is clicked (pressed and released)
 * <li>the mouse cursor enters a node
 * <li>the mouse cursor exits a node
 * </ul>
 * <p/>
 * A PMouseEvent object is passed to every <code>PMouseListener</code>
 * or <code>PMouseAdapter</code> object which registered to receive
 * the "interesting" mouse events using the component's
 * <code>addMouseListener</code> method.
 * (<code>PMouseAdapter</code> objects implement the
 * <code>PMouseListener</code> interface.) Each such listener object
 * gets a <code>PMouseEvent</code> containing the mouse event.
 * <p/>
 * <b>Warning:</b> Serialized objects of this class will not be
 * compatible with future Piccolo releases. The current serialization support is
 * appropriate for short term storage or RMI between applications running the
 * same version of Piccolo. A future release of Piccolo will provide support for long
 * term persistence.
 *
 * @author Benjamin B. Bederson
 * @author Sam R. Reid
 * @author Lance E. Good
 */
public class PSwingMouseEvent extends MouseEvent implements Serializable {
    private int id;
    private PInputEvent event;

    /**
     * Constructs a new PMouse event from a Java MouseEvent.
     *
     * @param id The event type (MOUSE_PRESSED, MOUSE_RELEASED, MOUSE_CLICKED, MOUSE_ENTERED, MOUSE_EXITED)
     * @param e  The original Java mouse event
     *           when in MOUSE_RELEASED events.
     */
    protected PSwingMouseEvent( int id, MouseEvent e, PInputEvent event ) {
        super( (Component)e.getSource(), e.getID(), e.getWhen(), e.getModifiers(), e.getX(), e.getY(), e.getClickCount(), e.isPopupTrigger() );
        this.id = id;
        this.event = event;
    }

    /**
     * Creates and returns a new PMouse event from a Java MouseEvent.
     *
     * @param id The event type (MOUSE_PRESSED, MOUSE_RELEASED, MOUSE_CLICKED, MOUSE_ENTERED, MOUSE_EXITED, MOUSE_MOVED, MOUSE_DRAGGED)
     * @param e  The original Java mouse event
     *           when in MOUSE_DRAGGED and MOUSE_RELEASED events.
     */
    public static PSwingMouseEvent createMouseEvent( int id,
                                                     MouseEvent e,
                                                     PInputEvent pEvent ) {
        if( id == PSwingMouseEvent.MOUSE_MOVED ||
            id == PSwingMouseEvent.MOUSE_DRAGGED ) {
            return new PSwingMouseMotionEvent( id, e, pEvent );
        }
        else {
            return new PSwingMouseEvent( id, e, pEvent );
        }
    }

    /**
     * Returns the x,y position of the event in the local coordinate system of the node
     * the event occurred on.
     *
     * @return a Point2D object containing the x and y coordinates local to the node.
     */
    public Point2D getLocalPoint() {
        return new Point2D.Double( getX(), getY() );
    }

    /**
     * Returns the horizontal x position of the event in the local coordinate system
     * of the node the event occurred on.
     *
     * @return x a double indicating horizontal position local to the node.
     */
    public double getLocalX() {
        return getLocalPoint().getX();
    }

    /**
     * Returns the vertical y position of the event in the local coordinate system
     * of the node the event occurred on.
     *
     * @return y a double indicating vertical position local to the node.
     */
    public double getLocalY() {
        return getLocalPoint().getY();
    }

    /**
     * Determine the event type.
     *
     * @return the id
     */
    public int getID() {
        return id;
    }

    /**
     * Determine the node the event originated at.  If an event percolates
     * up the tree and is handled by an event listener higher up in the
     * tree than the original node that generated the event, this returns
     * the original node.  For mouse drag and release events, this is the
     * node that the original matching press event went to - in other words,
     * the event is 'grabbed' by the originating node.
     *
     * @return the node
     */
    public PNode getNode() {
        return event.getPickedNode();
    }

    /**
     * Determine the path the event took from the PCanvas down to the visual component.
     *
     * @return the path
     */
    public PPickPath getPath() {
        return event.getPath();
    }

    /**
     * Determine the node the event originated at.  If an event percolates
     * up the tree and is handled by an event listener higher up in the
     * tree than the original node that generated the event, this returns
     * the original node.  For mouse drag and release events, this is the
     * node that the original matching press event went to - in other words,
     * the event is 'grabbed' by the originating node.
     *
     * @return the node
     */
    public PNode getGrabNode() {
        return event.getPickedNode();
    }

    /**
     * Return the path from the PCanvas down to the currently grabbed object.
     *
     * @return the path
     */
    public PPickPath getGrabPath() {
        return getPath();
    }

    /**
     * Get the current node that is under the cursor. This may return a different result then getGrabNode() when
     * in a MOUSE_RELEASED or MOUSE_DRAGGED event.
     *
     * @return the current node.
     */
    public PNode getCurrentNode() {
        return event.getPickedNode();
    }

    /**
     * Get the path from the PCanvas down to the visual component currently under the mouse.This may
     * give a different result then getGrabPath() durring a MOUSE_DRAGGED or MOUSE_RELEASED operation.
     *
     * @return the current path.
     */
    public PPickPath getCurrentPath() {
        return getPath();
    }

    /**
     * Calls appropriate method on the listener based on this events ID.
     *
     * @param listener the MouseListener or MouseMotionListener to dispatch to.
     */
    public void dispatchTo( Object listener ) {
        if( listener instanceof MouseListener ) {
            MouseListener mouseListener = (MouseListener)listener;
            switch( getID() ) {
                case PSwingMouseEvent.MOUSE_CLICKED:
                    mouseListener.mouseClicked( this );
                    break;
                case PSwingMouseEvent.MOUSE_ENTERED:
                    mouseListener.mouseEntered( this );
                    break;
                case PSwingMouseEvent.MOUSE_EXITED:
                    mouseListener.mouseExited( this );
                    break;
                case PSwingMouseEvent.MOUSE_PRESSED:
                    mouseListener.mousePressed( this );
                    break;
                case PSwingMouseEvent.MOUSE_RELEASED:
                    mouseListener.mouseReleased( this );
                    break;
                default:
                    throw new RuntimeException( "PMouseEvent with bad ID" );
            }
        }
        else {
            MouseMotionListener mouseMotionListener = (MouseMotionListener)listener;
            switch( getID() ) {
                case PSwingMouseEvent.MOUSE_DRAGGED:
                    mouseMotionListener.mouseDragged( this );
                    break;
                case PSwingMouseEvent.MOUSE_MOVED:
                    mouseMotionListener.mouseMoved( this );
                    break;
                default:
                    throw new RuntimeException( "PMouseMotionEvent with bad ID" );
            }
        }
    }

    /**
     * Set the souce of this event. As the event is fired up the tree the source of the
     * event will keep changing to reflect the scenegraph object that is firing the event.
     *
     * @param aSource
     */
    public void setSource( Object aSource ) {
        source = aSource;
    }
}
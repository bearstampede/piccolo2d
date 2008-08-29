package org.piccolo2d.svg;

import java.awt.Font;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class FontUtil {

    static final Pattern fsp = Pattern.compile("([+-]?[0-9]*(?:\\.[0-9]+)?(?:[eE][0-9]+)?)(px)?");

    /**
     * As fontsize of {@link Font#Font(String, int, int)} is an integer, we need
     * to avoid rounding errors. This could be done adaptive to e.g. ensure
     * fontsizes between 10 and 100
     */
    public static final int SCALE = 100;

    // <String, String>
    public static Font findFont(final Map attributes) {
        return findFont((String) attributes.get("font-family"), (String) attributes.get("font-style"),
                (CharSequence) attributes.get("font-size"));
    }

    public static Font findFont(final String family, final String style, final CharSequence size) {
        // font-family="Verdana" font-size="55" fill="blue" >
        final String ff = family;
        final int fs;
        {
            final Matcher s = fsp.matcher(size);
            if (!s.matches()) {
                throw new IllegalArgumentException("Fontsize [" + size + "] does not match [" + fsp.pattern() + "]");
            }
            fs = (int) (SCALE * Double.parseDouble(s.group(1)));
        }
        return new Font(ff, Font.PLAIN, fs);
    }
}

import java.time.LocalTime;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

public class OverlapTest {

    private static class Interval {
        long start, end;
        Interval(long s, long e) { start = s; end = e; }
    }

    private static List<Interval> getIntervals(int day, String st, String et) {
        LocalTime startTime = LocalTime.parse(st);
        LocalTime endTime = LocalTime.parse(et);
        
        long startM = (day - 1) * 24 * 60 + startTime.getHour() * 60 + startTime.getMinute();
        long endM = startM + Duration.between(startTime, endTime).toMinutes();
        if (endM <= startM) endM += 24 * 60;

        List<Interval> intervals = new ArrayList<>();
        if (endM > 7 * 24 * 60) {
            intervals.add(new Interval(startM, 7 * 24 * 60));
            intervals.add(new Interval(0, endM - 7 * 24 * 60));
        } else {
            intervals.add(new Interval(startM, endM));
        }
        return intervals;
    }

    private static boolean checkIntervalsOverlap(List<Interval> list1, List<Interval> list2) {
        for (Interval i1 : list1) {
            for (Interval i2 : list2) {
                if (i1.start < i2.end && i2.start < i1.end) {
                    return true;
                }
            }
        }
        return false;
    }

    public static void main(String[] args) {
        List<Interval> s1 = getIntervals(1, "09:00", "17:00");
        List<Interval> s2 = getIntervals(1, "12:00", "20:00");
        System.out.println("S1 intervals:");
        for(Interval i : s1) System.out.println(i.start + " - " + i.end);
        System.out.println("S2 intervals:");
        for(Interval i : s2) System.out.println(i.start + " - " + i.end);
        
        System.out.println("Overlap: " + checkIntervalsOverlap(s1, s2));
    }
}

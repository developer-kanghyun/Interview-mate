package com.interviewmate.domain.ai;

public class EvaluationWeights {

    private final int accuracy;
    private final int logic;
    private final int depth;
    private final int delivery;

    public EvaluationWeights(int accuracy, int logic, int depth, int delivery) {
        this.accuracy = accuracy;
        this.logic = logic;
        this.depth = depth;
        this.delivery = delivery;
    }

    public static EvaluationWeights defaultWeights() {
        return new EvaluationWeights(35, 25, 25, 15);
    }

    public int getAccuracy() {
        return accuracy;
    }

    public int getLogic() {
        return logic;
    }

    public int getDepth() {
        return depth;
    }

    public int getDelivery() {
        return delivery;
    }
}

import graphqlModelFactory from '@/models/_factory_graphql';
import Factory from '@/services/_factory';


export default function (modelName) {
  const Service = Factory({
    model: modelName,
  });

  const modelExtend = {
    effects: {

    },
  };

  return graphqlModelFactory({
    modelName,
    Service,
    modelExtend,
  });
}

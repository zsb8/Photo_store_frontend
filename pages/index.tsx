type HomePageProps = {
  now: string;
};

const HomePage = ({ now }: HomePageProps) => {
  return (
    <>
      SSR time: {now}
    </>
  );
};

export async function getServerSideProps() {
  return {
    props: {
      now: new Date().toISOString(),
    },
  };
}

export default HomePage;

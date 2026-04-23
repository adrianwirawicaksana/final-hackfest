interface CardProps {
    children: React.ReactNode;
}

const Card = ({ children }: CardProps) => {
  return (
    <div>
      <h1>{children}</h1>
    </div>
  );
};

export default Card;
